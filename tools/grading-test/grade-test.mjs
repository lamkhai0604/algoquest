// AlgoQuest grading test: let Gemini grade 20 sample answers and compare with the expected scores.
// Run:  GEMINI_API_KEY=your_key node grade-test.mjs
// Dry run without an API key:  MOCK=1 node grade-test.mjs

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALLOWED, SYSTEM_PROMPT, buildUserPrompt, RESPONSE_SCHEMA, snap, total } from './prompt.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const problems = JSON.parse(readFileSync(join(here, 'problems.json'), 'utf8'));
const samples = JSON.parse(readFileSync(join(here, 'samples.json'), 'utf8'));

const MOCK = process.env.MOCK === '1';
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'; // free tier: about 500 requests/day; gemini-3.8-flash allows about 20/day
const DELAY_MS = Number(process.env.DELAY_MS ?? (MOCK ? 0 : 13000)); // about 4-5 requests per minute: under every free Flash model's per-minute limit
const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // e.g. ONLY=S05,S12
const RESUME = process.env.RESUME === '1'; // keep answers already graded in the last CSV, grade only the rest
const MAX_ATTEMPTS = Number(process.env.MAX_ATTEMPTS ?? 6);
const backoff = (attempt) => Math.min(20000 * attempt, 90000);
const TOLERANCE = 10; // a total within +-10 of the expected counts as a match
const PASS_MARK = 70;
const CRITERIA = Object.keys(ALLOWED);

if (!MOCK && !API_KEY) {
  console.error('Missing GEMINI_API_KEY. Get a free key at https://aistudio.google.com/apikey');
  console.error('Or try a dry run first: MOCK=1 node grade-test.mjs');
  process.exit(1);
}

// Check that every expected score sits on the rubric grid.
for (const s of samples) {
  if (!problems.find((p) => p.id === s.problemId)) throw new Error(`${s.id}: unknown problem ${s.problemId}`);
  for (const c of CRITERIA) {
    if (!ALLOWED[c].includes(s.expected[c])) throw new Error(`${s.id}: expected.${c}=${s.expected[c]} is not one of ${ALLOWED[c]}`);
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
class DailyQuotaError extends Error {}

async function gradeWithGemini(problem, answer) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(problem, answer) }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      });
    } catch (err) {
      // Network error or timeout: retry like a temporary server error.
      if (attempt < MAX_ATTEMPTS) {
        const wait = backoff(attempt);
        console.warn(`  ${err.name === 'TimeoutError' ? 'timeout' : 'network error'}, waiting ${wait / 1000}s and retrying (${attempt}/${MAX_ATTEMPTS - 1})...`);
        await sleep(wait);
        continue;
      }
      throw new Error(`request failed after ${MAX_ATTEMPTS} attempts: ${err.message}`);
    }
    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error(`Empty response: ${JSON.stringify(data).slice(0, 300)}`);
      return JSON.parse(text);
    }
    const errText = await res.text();
    if (res.status === 429 && /PerDay/i.test(errText)) {
      throw new DailyQuotaError(`Daily free quota for "${MODEL}" is used up (resets at midnight Pacific time). Run later with RESUME=1, or try another free model with GEMINI_MODEL.`);
    }
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS) {
      const wait = backoff(attempt);
      console.warn(`  HTTP ${res.status}${res.status === 503 ? ' (model busy)' : ''}, waiting ${wait / 1000}s and retrying (${attempt}/${MAX_ATTEMPTS - 1})...`);
      await sleep(wait);
      continue;
    }
    if (res.status === 404) {
      throw new Error(`Model "${MODEL}" not found. Set GEMINI_MODEL to a free model listed in Google AI Studio.\n${errText.slice(0, 300)}`);
    }
    throw new Error(`HTTP ${res.status}: ${errText.slice(0, 300)}`);
  }
}

// Fake grader for a dry run: expected scores with a few deliberate mistakes, so the report has something to show.
function gradeMock(sample, i) {
  const out = { ...sample.expected, trace: '(mock)', feedback: '(mock)' };
  if (i % 7 === 3) out.complexity = out.complexity === 20 ? 10 : 20;
  if (i % 9 === 4) out.steps = out.steps === 30 ? 15 : 30;
  return out;
}

const outFile = join(here, MOCK ? 'results-mock.csv' : `results-${MODEL}.csv`);

// Minimal CSV reader for the file this script writes (every field quoted).
function readCsv(file) {
  const text = readFileSync(file, 'utf8');
  const records = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); records.push(row); row = []; field = ''; }
    else if (ch !== '\r') field += ch;
  }
  if (field || row.length) { row.push(field); records.push(row); }
  const [head, ...body] = records;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

const rows = [];
const previous = new Map();
if (RESUME && existsSync(outFile)) {
  for (const r of readCsv(outFile)) {
    if (r.error || r.got_total === '') continue;
    const sample = samples.find((s) => s.id === r.id);
    if (!sample) continue;
    const got = Object.fromEntries(CRITERIA.map((c) => [c, Number(r[`got_${c}`])]));
    previous.set(r.id, { sample, got, exp: sample.expected, diff: total(got) - total(sample.expected), feedback: r.feedback, trace: r.trace ?? '' });
  }
  console.log(`Resuming: ${previous.size} answers already graded in ${outFile}`);
}
const list = (ONLY ? samples.filter((s) => ONLY.includes(s.id)) : samples);
console.log(`Grading ${list.length} answers with ${MOCK ? 'MOCK grader' : MODEL}...\n`);

for (const [i, sample] of list.entries()) {
  if (previous.has(sample.id)) {
    const row = previous.get(sample.id);
    rows.push(row);
    console.log(`SKIP ${sample.id}  already graded: expected ${total(row.exp)}  got ${total(row.got)}`);
    continue;
  }
  const problem = problems.find((p) => p.id === sample.problemId);
  let raw;
  try {
    raw = MOCK ? gradeMock(sample, i) : await gradeWithGemini(problem, sample.answer);
  } catch (err) {
    console.error(`${sample.id}: ERROR ${err.message}`);
    rows.push({ sample, error: err.message });
    if (err instanceof DailyQuotaError) {
      for (const rest of list.slice(i + 1)) {
        rows.push(previous.get(rest.id) ?? { sample: rest, error: 'not graded: daily quota used up' });
      }
      break;
    }
    continue;
  }
  const got = Object.fromEntries(CRITERIA.map((c) => [c, snap(c, raw[c])]));
  const exp = sample.expected;
  const diff = total(got) - total(exp);
  const row = { sample, got, exp, diff, feedback: raw.feedback ?? '', trace: raw.trace ?? '' };
  rows.push(row);
  const mark = Math.abs(diff) <= TOLERANCE ? 'OK ' : 'OFF';
  console.log(
    `${mark} ${sample.id}  expected ${String(total(exp)).padStart(3)}  got ${String(total(got)).padStart(3)}  (${diff >= 0 ? '+' : ''}${diff})  ${sample.note}`
  );
  if (DELAY_MS && i < list.length - 1) await sleep(DELAY_MS);
}

// Summary
const graded = rows.filter((r) => !r.error);
const n = graded.length;
if (n === 0) {
  console.error('\nNothing was graded.');
  process.exit(1);
}
const mae = graded.reduce((a, r) => a + Math.abs(r.diff), 0) / n;
const off = graded.filter((r) => Math.abs(r.diff) > TOLERANCE);
const passAgree = graded.filter((r) => (total(r.got) >= PASS_MARK) === (total(r.exp) >= PASS_MARK)).length;
const perCriterion = CRITERIA.map((c) => {
  const m = graded.reduce((a, r) => a + Math.abs(r.got[c] - r.exp[c]), 0) / n;
  return `${c} ${m.toFixed(1)}`;
});

console.log('\n===== SUMMARY =====');
console.log(`Graded: ${n}/${list.length}${rows.length - n ? `  (errors: ${rows.length - n})` : ''}`);
console.log(`Average difference per answer: ${mae.toFixed(1)} points`);
console.log(`Off by more than ${TOLERANCE} points: ${off.length}${off.length ? ' -> ' + off.map((r) => r.sample.id).join(', ') : ''}`);
console.log(`Pass/fail (>= ${PASS_MARK}) agrees with expected: ${passAgree}/${n}`);
console.log(`Average difference by criterion: ${perCriterion.join(' | ')}`);
const good = mae <= 8 && off.length <= 3 && passAgree >= n - 1;
console.log(
  good
    ? 'Verdict: GOOD ENOUGH - this model can grade AlgoQuest answers.'
    : 'Verdict: NOT YET - check the OFF answers, adjust the prompt or answer keys, or try another model.'
);

// CSV for a closer look (opens in Excel / Google Sheets)
const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
const header = ['id', 'problem', 'note', ...CRITERIA.flatMap((c) => [`exp_${c}`, `got_${c}`]), 'exp_total', 'got_total', 'diff', 'trace', 'feedback', 'error'];
const lines = rows.map((r) =>
  [
    r.sample.id,
    r.sample.problemId,
    r.sample.note,
    ...CRITERIA.flatMap((c) => [r.exp?.[c] ?? r.sample.expected[c], r.got?.[c] ?? '']),
    total(r.sample.expected),
    r.got ? total(r.got) : '',
    r.diff ?? '',
    r.trace ?? '',
    r.feedback ?? '',
    r.error ?? '',
  ].map(esc).join(',')
);
writeFileSync(outFile, [header.map(esc).join(','), ...lines].join('\n'));
console.log(`\nDetails saved to ${outFile}`);
if (rows.some((r) => r.error)) {
  console.log('Some answers were not graded (model busy or network). Run again with RESUME=1 to grade only those.');
}
