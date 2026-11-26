# Observability and SLOs

## Learning objectives

- Describe what logs, metrics and traces each tell you, and which one to open first for a given question.
- Follow one request across several services with a request ID and a trace.
- Read p50, p95 and p99 latency, and explain why an average hides slow requests.
- Write an SLI and an SLO for a feature, and turn the SLO into an error budget.
- Choose alerts that fire on what users feel, and decide how fast a problem must be to wake someone.

### Key terms

- **Log.** A line a service writes about one event, such as "order 123 failed: card declined", with a time and details. Logs say what happened to one request.
- **Metric.** A number measured over time, such as requests per second or the share that failed. Metrics are cheap to keep and show trends, but not which request was affected.
- **Trace.** The path of one request through every service it touched, made of **spans**: one span per step, with its start time and duration. Every span carries the same **request ID**.
- **Percentile.** The p95 latency is the time that 95% of requests meet or beat; p50 is the middle request, and p99 is the slowest 1 in 100. Slow requests at p99 and above are called **tail latency**.
- **SLI (service level indicator).** A measure of what users feel, written as a share of good events, such as the share of checkout requests that succeed within 2 seconds.
- **SLO (service level objective).** The target for an SLI over a window, such as 99.9% of checkouts good over 30 days.
- **SLA (service level agreement).** A promise to customers in a contract, with a penalty if it is missed. It is usually looser than the SLO, so the team notices problems before the contract is at risk.
- **Error budget.** The bad events an SLO allows: with 99.9%, 0.1% of requests may be bad. While budget is left, the team can ship changes; when it runs out, reliability work comes first.
- **Burn rate.** How fast the budget is being spent compared with spending it evenly over the window. At a burn rate of 10, a 30-day budget is gone in 3 days.
- **Alerting on symptoms.** Waking someone for what users feel, such as failing or slow checkouts, rather than for a cause, such as high CPU, that may or may not hurt anyone.

## Problem hook

The shop from SD 11 survived its sale, but customers still write that checkout is "sometimes really slow". The dashboard shows an average checkout time of 194 ms, which looks fine. CPU is at 60%. Nothing is red.

The team cannot reproduce the problem, cannot tell which of the six services is at fault, and argues about whether it matters. They need to see the slow requests that the average hides, follow one of them through the services, and agree on how good is good enough.

## Intuition

Think of a delivery company. A **metric** is the daily report: 10,000 parcels, 98% on time. A **log** is the driver's notebook: "14:05, parcel 77, nobody home". A **trace** is the tracking page for one parcel: picked up, sorting center, truck, doorstep, with a time at each stop. When a customer complains, you open the tracking page first; the daily report only tells you whether there is a trend.

"98% on time" also hides who waited. If the late parcels all go to one town, that town is unhappy even though the average looks good. That is why teams look at percentiles, and why the company promises "99% of parcels within 2 days" rather than "an average of 1.2 days".

**A link to SD 5 and SD 11.** Requests cross the services and timeouts of SD 5, and SD 11's availability in nines becomes a target the team can measure and spend.

## When to use

- **Metrics:** to see trends and to alert: request rate, share of errors, latency percentiles, saturation such as CPU or queue length.
- **Traces:** to find where the time goes in one slow request that crosses several services.
- **Logs:** to see the details of one event, such as the error message, found through the request ID from a trace.
- **Percentiles instead of averages:** whenever latency matters; look at p50 for the usual experience and p95 or p99 for the slow ones.
- **An SLO and an error budget:** for each feature users depend on, to agree how reliable it must be and when to slow down changes.
- **A page (waking someone):** only when users are hurt now and the budget will be gone soon; slower problems become a ticket for working hours.

## Template code

There is no code in this level. Use this **design template** for observing a feature:

```text
1. What do users feel? Write the SLI as a share of good events, such as
   "checkout requests that succeed within 2 s", measured near the user.
2. Choose the SLO and window, such as 99.9% over 30 days.
   Error budget = (1 - SLO) x events in the window.
3. Metrics per service: rate, errors, p50 / p95 / p99 latency, saturation.
4. A request ID on every call; traces kept for every slow or failed
   request and a small share of the rest; logs that carry the request ID.
5. Alerts: page when the budget would be gone within hours or a day;
   a ticket when it would run out before the window ends.
6. Check the storage cost: events per second x bytes x seconds kept.
```

## Complexity

**Why the average hides the tail.** Of 100 checkouts, 90 take 100 ms, 8 take 300 ms and 2 take 4,000 ms. The average is (90 × 100 + 8 × 300 + 2 × 4,000) ÷ 100 = 194 ms. Sorted, the 50th request takes 100 ms (p50), the 95th takes 300 ms (p95), and the 99th takes 4,000 ms (p99). The average describes nobody: most users see 100 ms, and 2 in 100 wait 4 seconds.

**Why the tail matters more than it looks.** A page that calls 10 services, each slow 1% of the time, is slow whenever any one of them is: 1 − 0.99¹⁰ ≈ 0.096, about 10% of pages. A user who loads 100 pages meets a 1-in-100 slow request with chance 1 − 0.99¹⁰⁰ ≈ 63%.

**Error budget.** At 40 checkouts per second on average, a 30-day month has 40 × 2,592,000 ≈ 104 million checkouts. An SLO of 99.9% allows 0.1% of them to be bad: about 104,000. As time, 0.1% of 43,200 minutes is about 43 minutes of full outage.

**Burn rate.** Burn rate = share of bad requests ÷ share the SLO allows. If 5% of checkouts go bad, the burn rate is 5% ÷ 0.1% = 50, and a 30-day budget lasts 30 ÷ 50 = 0.6 days, about 14 hours. The budget is gone within 1 day when the burn rate is 30 or more, that is, when 3% or more of requests are bad.

**What it costs to keep.** At 2,400 requests per second, one 1 KB log line per request is 2.4 MB per second, about 207 GB a day. Traces are larger, so teams keep every slow or failed trace and a small share, such as 1%, of the rest. Metrics are small: one number per measure every few seconds, whatever the traffic.

| Signal | Answers | Cost | Weakness |
| --- | --- | --- | --- |
| Metrics | Is something wrong, and since when? | Small, fixed | Cannot show which request |
| Traces | Where did this request spend its time? | Large; usually sampled | Sampled traces may miss a rare case |
| Logs | What exactly happened in this step? | Large; grows with traffic | Hard to search without a request ID |

## Common mistakes

- **Watching only the average.** It can stay flat while 1 in 100 users waits seconds. Show p50, p95 and p99 side by side.
- **Averaging percentiles.** The p99 of two servers is not the average of their p99s; compute it from all the requests, or from combined counts per time range.
- **Alerting on causes.** CPU at 90% may be planned (SD 11) and hurt nobody, while a full disk on a backup server may matter tomorrow but not tonight. Page on symptoms users feel; show causes on dashboards to explain them.
- **An SLO of 100%.** It leaves no budget for releases, failures of dependencies or maintenance, and the users' own networks fail more often than that anyway.
- **Logs without a request ID.** Finding the lines for one slow request across six services becomes guesswork.

## Edge cases

- **Few requests.** At 2 requests per minute, the p99 of one hour rests on about one request. Use a longer window or count bad events instead.
- **Measured in the wrong place.** A server that is down reports nothing, so its own metrics look clean. Measure the SLI where users are closest, such as at the load balancer.
- **A dependency's SLO.** If checkout needs a card provider whose own target is 99.9%, a 99.99% checkout SLO is unrealistic without a fallback.
- **Sampling hides rare failures.** Keeping 1% of traces at random keeps 1% of the rare slow ones too. Decide to keep a trace after seeing that it was slow or failed.

### Extension (optional): dashboard design

A good service dashboard answers "is it healthy, and if not, where?" in a few seconds. Put the SLIs first: the share of good requests and how much error budget is left. Then the four **golden signals** per service: **latency** (p50, p95, p99), **traffic** (requests per second), **errors** (share failing) and **saturation** (how full the most limited resource is, such as CPU, workers or a queue). Use the same time range on every graph, mark releases on the time line, and link each graph to the traces and logs for that service and time.

## Worked example

**Problem:** Checkout in the shop takes about 40 requests per second on average over a month, and up to 100 at peak. It calls six services. Users abandon a checkout that takes more than 2 seconds. Last month, 99.95% of checkouts succeeded, and 99.8% both succeeded and finished within 2 seconds. Customers say checkout is "sometimes really slow", but the average is 194 ms. Choose an SLI and an SLO, work out the error budget, choose when to page, and find the slow service.

**Solution:**

1. **SLI.** "The share of checkout requests that succeed within 2 seconds, measured at the load balancer." It counts both failures and slow answers, the two things users feel, and it is measured close to them.
2. **SLO.** Last month 99.8% met the SLI. A target of 99.9% over 30 days would already have been missed, so the team starts at 99.5%, which it meets with room to spare, and plans to tighten it after fixing the slow requests.
3. **Error budget.** 40 × 2,592,000 ≈ 104 million checkouts a month; 0.5% of them is about 518,000 bad checkouts. Last month used 0.2%, so 0.2 ÷ 0.5 = 40% of the budget.
4. **When to page.** The budget is gone within 1 day at a burn rate of 30: 30 × 0.5% = 15% of checkouts bad. Page when the last hour's bad share is above 15%; open a ticket when the last day's share is above 0.5%, which would use up the month's budget before the month ends.
5. **Find the slow service.** Checkout's p50 is 100 ms but its p99 is 4,000 ms. The traces kept for slow checkouts show the time is in the Payment service, waiting on the card provider; the logs for those request IDs show retries after timeouts. The fix belongs to SD 11: a shorter timeout and one retry with jitter.

**Answer:** SLI: checkouts that succeed within 2 seconds, at the load balancer. SLO: 99.5% over 30 days for now, about 518,000 bad checkouts allowed, 40% of it used last month. Page when more than 15% of an hour's checkouts are bad; open a ticket when a day's share passes 0.5%. Traces of slow checkouts point to the card provider calls in Payment.
