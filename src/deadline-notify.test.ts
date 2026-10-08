import assert from "node:assert/strict";
import { sendDeadlineNotice } from "./deadline-notify.js";

const calls: Array<{ path: string; body: any }> = [];
const client = { request: async (path: string, _method: "POST", body: unknown) => { calls.push({ path, body }); return {}; } } as any;
const result = await sendDeadlineNotice({ learnerId: "l1", courseId: "c1", title: "Quiz", dueAt: "2026-10-01T09:00:00.000Z", online: false }, client);
assert.equal(result, "durable");
assert.equal(calls[0].path, "/v1/queue/publish");
assert.match(calls[0].body.payload, /course.deadline/);
console.log("deadline decision: offline learners receive a durable queue message");
