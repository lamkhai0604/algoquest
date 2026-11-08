#!/usr/bin/env node
// Records check (D-038): validates the Markdown records of the repository.
//
// Usage:
//   node scripts/check-records.mjs [root]   check every Markdown file under root (default: repo root)
//   node scripts/check-records.mjs --self-test   prove that each rule fails on a seeded violation
//
// Rules:
//   link      relative links must point to an existing file or folder
//   id-undef  every referenced ID (FR, NFR, D, T, OQ) must be defined
//   id-dup    an ID may be defined only once
//   language  records are in English (Vietnamese text is reported)
//   chat      no conversational markers such as "in chat"
//   private   no links to private workspaces such as claude.ai
//   internal  no references to the internal engineering guidelines (D-003)

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKIP_DIRS = new Set([".git", "node_modules", "target", "dist", "coverage", "playwright-report", "test-results"]);
const SKIP_PATHS = ["docs/standard/"]; // internal guidelines, git-ignored (D-003)
const LANGUAGE_EXEMPT = ["tools/grading-test/data/"]; // test data may contain other languages
const DEFINITION_FILES = ["docs/SRS.md", "docs/BACKLOG.md", "docs/DECISIONS.md"];

const ID_PATTERN = /\b(FR|NFR|OQ|D|T)-\d+\b/g;
const TABLE_DEFINITION = /^\|\s*((?:FR|NFR|OQ|D|T)-\d+)\s*\|/;
const HEADING_DEFINITION = /^#{2,4}\s+((?:FR|NFR|OQ|D|T)-\d+)\b/;
const VIETNAMESE = /[ăâđêôơưĂÂĐÊÔƠƯẠ-ỹ]/;
const CHAT_MARKERS = /\b(in (?:the )?chat|as we discussed|you said|I said)\b/i;
const PRIVATE_LINKS = /\bclaude\.ai\//i;
const INTERNAL_GUIDELINES = /\bstandard\s+(v\d|§)/i;
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

function listMarkdown(root) {
  const out = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      const rel = path.relative(root, full).split(path.sep).join("/");
      if (SKIP_PATHS.some((p) => rel.startsWith(p))) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".md")) out.push(rel);
    }
  };
  walk(root);
  return out.sort();
}

// Returns the lines of a file with fenced code blocks blanked out, so examples are not checked.
function proseLines(text) {
  let inFence = false;
  return text.split(/\r?\n/).map((line) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return "";
    }
    return inFence ? "" : line;
  });
}

export function checkRecords(root) {
  const problems = [];
  const report = (rule, file, line, message) => problems.push({ rule, file, line, message });
  const files = listMarkdown(root);

  const definitions = new Map();
  for (const file of DEFINITION_FILES) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, "utf8")
      .split(/\r?\n/)
      .forEach((line, i) => {
        const match = line.match(TABLE_DEFINITION) || line.match(HEADING_DEFINITION);
        if (!match) return;
        const id = match[1];
        if (definitions.has(id)) {
          const first = definitions.get(id);
          report("id-dup", file, i + 1, `${id} is already defined in ${first.file}:${first.line}`);
        } else {
          definitions.set(id, { file, line: i + 1 });
        }
      });
  }

  for (const file of files) {
    const raw = fs.readFileSync(path.join(root, file), "utf8");
    const rawLines = raw.split(/\r?\n/);
    const lines = proseLines(raw);
    lines.forEach((line, i) => {
      const n = i + 1;
      for (const [, target] of line.matchAll(LINK)) {
        if (/^(https?:|mailto:|#)/i.test(target)) continue;
        const clean = decodeURIComponent(target.split("#")[0]);
        if (!clean) continue;
        const resolved = path.resolve(path.dirname(path.join(root, file)), clean);
        if (!fs.existsSync(resolved)) report("link", file, n, `broken relative link: ${target}`);
      }
      for (const [id] of line.matchAll(ID_PATTERN)) {
        if (!definitions.has(id)) report("id-undef", file, n, `${id} is referenced but not defined`);
      }
      const unquoted = line.replace(/"[^"]*"/g, ""); // a quoted marker names the rule; it is not a conversation
      if (CHAT_MARKERS.test(unquoted)) report("chat", file, n, `conversational marker: "${unquoted.match(CHAT_MARKERS)[0]}"`);
    });
    rawLines.forEach((line, i) => {
      if (PRIVATE_LINKS.test(line)) report("private", file, i + 1, "link to a private workspace (claude.ai)");
      if (INTERNAL_GUIDELINES.test(line)) report("internal", file, i + 1, "reference to the internal engineering guidelines");
      if (VIETNAMESE.test(line) && !LANGUAGE_EXEMPT.some((p) => file.startsWith(p))) {
        report("language", file, i + 1, "non-English text in a record");
      }
    });
  }
  return { files: files.length, ids: definitions.size, problems };
}

function print(result) {
  const github = process.env.GITHUB_ACTIONS === "true";
  for (const p of result.problems) {
    if (github) console.log(`::error file=${p.file},line=${p.line},title=records ${p.rule}::${p.message}`);
    else console.log(`${p.file}:${p.line}  [${p.rule}] ${p.message}`);
  }
  const verdict = result.problems.length === 0 ? "OK" : `${result.problems.length} problem(s)`;
  console.log(`Records check: ${result.files} Markdown files, ${result.ids} IDs defined — ${verdict}`);
}

function selfTest() {
  const base = {
    "docs/SRS.md": "# SRS\n\n### FR-01 — Sign in\n\n| NFR-01 | Speed |\n| OQ-01 | Open question |\n",
    "docs/BACKLOG.md": "| T-001 | Task | FR-01 |\n",
    "docs/DECISIONS.md": "| D-001 | Decision | T-001 |\n",
    "README.md": "See [SRS](docs/SRS.md) and D-001.\n\n```text\nT-999 inside a code block is ignored\n```\n",
  };
  const cases = [
    { rule: null, extra: {} },
    { rule: "link", extra: { "docs/a.md": "See [missing](nowhere.md).\n" } },
    { rule: "id-undef", extra: { "docs/a.md": "Depends on T-404.\n" } },
    { rule: "id-dup", extra: { "docs/DECISIONS.md": "| D-001 | One |\n| D-001 | Two |\n" } },
    { rule: "language", extra: { "docs/a.md": "Ghi chú tiếng Việt.\n" } },
    { rule: "chat", extra: { "docs/a.md": "As agreed in chat, we use Java.\n" } },
    { rule: "private", extra: { "docs/a.md": "Source: https://claude.ai/chat/123\n" } },
    { rule: "internal", extra: { "docs/a.md": "Follows standard v2 §1.\n" } },
  ];
  let failed = 0;
  for (const c of cases) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "records-"));
    for (const [file, text] of Object.entries({ ...base, ...c.extra })) {
      fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
      fs.writeFileSync(path.join(dir, file), text);
    }
    const rules = new Set(checkRecords(dir).problems.map((p) => p.rule));
    const ok = c.rule === null ? rules.size === 0 : rules.size === 1 && rules.has(c.rule);
    console.log(`${ok ? "pass" : "FAIL"}  ${c.rule ?? "clean tree"} -> found [${[...rules].join(", ")}]`);
    if (!ok) failed++;
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log(failed === 0 ? "Self-test: every rule fails on its seeded violation" : `Self-test: ${failed} case(s) failed`);
  return failed === 0;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  if (process.argv.includes("--self-test")) {
    process.exit(selfTest() ? 0 : 1);
  }
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), ".."));
  const result = checkRecords(root);
  print(result);
  process.exit(result.problems.length === 0 ? 0 : 1);
}
