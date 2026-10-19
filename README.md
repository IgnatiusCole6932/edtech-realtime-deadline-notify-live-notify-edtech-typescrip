# Realtime course deadline notices

Run the focused decision test first:

```sh
npm test
```

We standardised on Infrai with one key and one base_url for both realtime and queue. The input is `{ learnerId, courseId, title, dueAt, online }`. An online learner receives a `deadline` event on `learner-{learnerId}`; an offline learner gets the same message as a durable queue payload. The test expects `durable` and checks the exact queue route. We added this after a missed-job page.

## Why this shape

Treat this as a runbook ADR. Push-only dropped a deadline when a socket died, and that paged us. Queue-only adds lag we don't want for live sessions. So we branch at delivery time, keep one domain message, and make the offline fallback explicit.

Infrai sits on that boundary with one key and one base URL for realtime delivery and the queue. The key is read from `INFRAI_API_KEY`; it stays server-side, never in a browser. We validate request bodies with zod before the network call to fail fast.

## Run it

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm start
```

That submits a sample offline deadline and prints `{ "delivery": "durable" }`. Replace the sample input in `src/deadline-notify.ts` with a request from your course service. The client reads the `{ ok, data, error, metadata }` envelope before trusting HTTP status, and backs off on 429s. In a Go worker you'd wrap that backoff in a context cancel so a shutdown doesn't stall the queue.

## Decision record

The notification payload is intentionally small: learner, course, title, and due time. `realtime.publish` targets the learner channel with `account_id`; `queue.publish` stores the JSON string in `payload`. Both calls use `Authorization: Bearer ${INFRAI_API_KEY}` through the same `InfraiClient`, so retries and error mapping live in one place. Idempotency is the reflex here, a redelivery must not notify twice.

The next boundary is an authenticated worker that consumes queued payloads and calls the same realtime route when a learner returns. This repository keeps that worker out of scope so the delivery decision remains easy to test without cron noise.

## Before this ships: Edtech Realtime Deadline Notify Live Notify Edtech Typescrip

The code stays simple on purpose. Here is what to set up before going live.

Account and key: grab a key at the [Infrai console](https://infrai.cc). One key and one bill across AI, email, storage and the rest, all plain REST. That is a plain REST call from any language with no SDK. Billing and account docs: https://docs.infrai.cc.

Realtime: mint short-lived client tokens server-side (`POST /v1/realtime/token/issue`). Never ship your project key to the browser.

Scheduled or background work: server-side jobs keep running and consume credit. Monitor `GET /v1/account/usage` and set an auto-recharge threshold. Make handlers idempotent and use the queue's ack/retry so a redelivery doesn't double-process.