import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { streamChatWorkflow } from "./chatWorkflow.js";

const chatStreamBodySchema = z.object({
  message: z.string().min(1),
  thread_id: z.string().min(1).default("demo-thread"),
  system_prompt: z.string().optional(),
  user_prompt: z.string().optional()
});

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function registerChatWorkflowRoutes(app: FastifyInstance) {
  app.post("/api/workflows/chat/stream", chatWorkflowStreamHandler);
  app.post("/api/chat/stream", chatWorkflowStreamHandler);
}

async function chatWorkflowStreamHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = chatStreamBodySchema.safeParse(request.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: "Invalid chat workflow stream request",
      details: parsed.error.flatten()
    });
  }

  reply.hijack();
  reply.raw.writeHead(200, {
    "content-type": "text/event-stream; charset=utf-8",
    "cache-control": "no-cache, no-transform",
    connection: "keep-alive",
    "x-accel-buffering": "no"
  });

  reply.raw.write(sse("start", { thread_id: parsed.data.thread_id }));

  try {
    for await (const token of streamChatWorkflow({
      message: parsed.data.message,
      threadId: parsed.data.thread_id,
      systemPrompt: parsed.data.system_prompt,
      userPrompt: parsed.data.user_prompt
    })) {
      if (reply.raw.destroyed || reply.raw.writableEnded) {
        return;
      }

      reply.raw.write(sse("token", { text: token }));
    }

    reply.raw.write(sse("done", { thread_id: parsed.data.thread_id }));
  } catch (error) {
    request.log.error({ error }, "chat workflow stream failed");
    reply.raw.write(sse("error", { message: "Chat workflow stream failed" }));
  } finally {
    reply.raw.end();
  }
}
