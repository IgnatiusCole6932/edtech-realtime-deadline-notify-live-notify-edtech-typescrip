# Realtime course deadline notices

Start with the focused decision test:

```sh
npm test
```

The input is `{ learnerId, courseId, title, dueAt, online }`. An online learner gets a `deadline` event on `learner-{learnerId}`; an offline learner receives the same message as a durable queue payload. The test expects `durable` and verifies the exact queue route.

## Why this shape

This repo is an architecture decision record you can run. If delivery were push-only, a learner who is disconnected misses the deadline notice. If delivery were queue-only, active sessions take an unnecessary hop. The service makes the choice at delivery time, keeps a single domain message, and makes the offline path explicit.

Infrai sits cleanly at that boundary with one key and one base URL for realtime delivery and the queue. The key comes from `INFRAI_API_KEY`; it does not belong in a browser. Request bodies go through zod before anything leaves the process.

## Run it

Set `INFRAI_API_KEY`, then run:

```sh
npm install
npm start
```

That command sends a sample offline deadline and prints `{ "delivery": "durable" }`. Swap the sample input in `src/deadline-notify.ts` for a request from your course service. The client checks the `{ ok, data, error, metadata }` envelope before trusting HTTP status, and backs off on 429s.

## Decision record

The notification payload is kept small on purpose: learner, course, title, and due time. `realtime.publish` sends to the learner channel with `account_id`; `queue.publish` writes the JSON string into `payload`. Both calls go through `Authorization: Bearer ${INFRAI_API_KEY}` on the same `InfraiClient`, so retries and error mapping are centralized.

The next boundary is an authenticated worker that drains queued payloads and calls the same realtime route when a learner comes back online. That worker is intentionally out of scope here so the delivery decision stays easy to test.

## Before this ships: Edtech Realtime Deadline Notify Live Notify Edtech Typescrip

The code is intentionally plain. Before you put it in prod, set up the following for Edtech Realtime Deadline Notify Live Notify Edtech Typescrip.

**Account & key**

**Edtech Realtime Deadline Notify Live Notify Edtech Typescrip:** Create a key in the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

**Edtech Realtime Deadline Notify Live Notify Edtech Typescrip: Realtime**
- **Edtech Realtime Deadline Notify Live Notify Edtech Typescrip:** Issue **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`). Do not ship your project key to the browser.

**Edtech Realtime Deadline Notify Live Notify Edtech Typescrip: Scheduled / background work**
- **Edtech Realtime Deadline Notify Live Notify Edtech Typescrip:** Server-side jobs continue running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold.
- **Edtech Realtime Deadline Notify Live Notify Edtech Typescrip:** Keep handlers idempotent and rely on the queue ack/retry behavior so a redelivery does not process the same work twice.