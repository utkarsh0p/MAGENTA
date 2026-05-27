import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  createSession,
  createUser,
  deleteSession,
  getUserBySessionToken,
  initializeAuthStore,
  verifyUserCredentials
} from "./authStore.js";

const authCookieName = "humantouch_session";

const signInBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const signUpBodySchema = signInBodySchema.extend({
  name: z.string().min(2)
});

function readCookie(request: FastifyRequest, name: string) {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValueParts] = part.trim().split("=");

    if (rawKey === name) {
      return decodeURIComponent(rawValueParts.join("="));
    }
  }

  return undefined;
}

function setSessionCookie(reply: FastifyReply, token: string, maxAgeSeconds: number) {
  reply.header(
    "set-cookie",
    `${authCookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`
  );
}

function clearSessionCookie(reply: FastifyReply) {
  reply.header(
    "set-cookie",
    `${authCookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

export async function registerAuthRoutes(app: FastifyInstance) {
  await initializeAuthStore();

  app.post("/api/auth/signup", async (request, reply) => {
    const parsed = signUpBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid signup request",
        details: parsed.error.flatten()
      });
    }

    const result = await createUser({
      email: parsed.data.email,
      fullName: parsed.data.name,
      password: parsed.data.password
    });

    if (!result.ok) {
      return reply.code(409).send({ error: "Email already registered" });
    }

    const { token, maxAgeSeconds } = await createSession(result.user.id);
    setSessionCookie(reply, token, maxAgeSeconds);

    return reply.code(201).send({ user: result.user });
  });

  app.post("/api/auth/login", async (request, reply) => {
    const parsed = signInBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid login request",
        details: parsed.error.flatten()
      });
    }

    const user = await verifyUserCredentials(parsed.data.email, parsed.data.password);

    if (!user) {
      return reply.code(401).send({ error: "Invalid email or password" });
    }

    const { token, maxAgeSeconds } = await createSession(user.id);
    setSessionCookie(reply, token, maxAgeSeconds);

    return reply.send({ user });
  });

  app.get("/api/auth/me", async (request, reply) => {
    const user = await getUserBySessionToken(readCookie(request, authCookieName));

    if (!user) {
      return reply.code(401).send({ error: "Unauthorized" });
    }

    return reply.send({ user });
  });

  app.post("/api/auth/logout", async (request, reply) => {
    await deleteSession(readCookie(request, authCookieName));
    clearSessionCookie(reply);

    return reply.send({ ok: true });
  });
}
