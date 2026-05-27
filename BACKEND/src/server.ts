import Fastify from "fastify";
import cors from "@fastify/cors";
import { config, assertRuntimeConfig } from "./config.js";
import { registerAuthRoutes } from "./auth/routes.js";
import { registerChatWorkflowRoutes } from "./workflows/chat/routes.js";

assertRuntimeConfig();

const app = Fastify({
  logger: true
});

await app.register(cors, {
  origin(origin, callback) {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed`), false);
  },
  credentials: true
});

app.get("/health", async () => ({
  ok: true,
  service: "humantouch-backend"
}));

await app.register(registerAuthRoutes);
await app.register(registerChatWorkflowRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
