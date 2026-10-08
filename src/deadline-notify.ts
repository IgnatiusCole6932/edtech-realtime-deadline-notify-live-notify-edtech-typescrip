import { z } from "zod";
import { InfraiClient } from "./infrai-client.js";

export const DeadlineRequest = z.object({ learnerId: z.string().min(1), courseId: z.string().min(1), title: z.string().min(1), dueAt: z.string().datetime(), online: z.boolean() });
export type DeadlineRequest = z.infer<typeof DeadlineRequest>;

export async function sendDeadlineNotice(input: unknown, client = new InfraiClient()): Promise<"realtime" | "durable"> {
  const request = DeadlineRequest.parse(input);
  const message = { type: "course.deadline", learnerId: request.learnerId, courseId: request.courseId, title: request.title, dueAt: request.dueAt };
  if (request.online) {
    await client.request("/v1/realtime/publish", "POST", { channel: `learner-${request.learnerId}`, event: "deadline", data: message, account_id: request.learnerId });
    return "realtime";
  }
  await client.request("/v1/queue/publish", "POST", { queue: "course-deadline-notifications", payload: JSON.stringify(message) });
  return "durable";
}

if (process.argv[1]?.endsWith("deadline-notify.ts")) {
  const result = await sendDeadlineNotice({ learnerId: "learner-42", courseId: "course-7", title: "Finish module 3", dueAt: "2026-10-01T09:00:00.000Z", online: false });
  console.log(JSON.stringify({ delivery: result }));
}
