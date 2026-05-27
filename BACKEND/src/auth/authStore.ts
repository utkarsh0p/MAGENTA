import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import pg from "pg";
import { config } from "../config.js";

const { Pool } = pg;
const scrypt = promisify(scryptCallback);

const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const demoCompanyId = "00000000-0000-0000-0000-000000000001";

const pool = new Pool({
  connectionString: config.databaseUrl
});

export type PublicAuthUser = {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  role_key: string;
  is_admin: boolean;
  auth_provider: string;
};

type DbUser = PublicAuthUser & {
  password_hash: string | null;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll("\"", "\"\"")}"`;
}

const schemaName = config.appDbSchema;
const schemaSql = quoteIdentifier(schemaName);

function tableSql(tableName: string) {
  return `${schemaSql}.${quoteIdentifier(tableName)}`;
}

function toPublicUser(user: DbUser): PublicAuthUser {
  return {
    id: user.id,
    company_id: user.company_id,
    email: user.email,
    full_name: user.full_name,
    role_key: user.role_key,
    is_admin: user.is_admin,
    auth_provider: user.auth_provider
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const parts = storedHash.split(":");
  const [algorithmOrSalt, saltOrKey, key] = parts;

  if (parts.length === 3 && algorithmOrSalt === "scrypt" && saltOrKey && key) {
    return verifyScryptPassword(password, saltOrKey, key);
  }

  if (parts.length === 2 && algorithmOrSalt && saltOrKey) {
    return verifyScryptPassword(password, algorithmOrSalt, saltOrKey);
  }

  return false;
}

async function verifyScryptPassword(password: string, salt: string, key: string) {
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const storedKey = Buffer.from(key, "hex");

  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}

async function getDefaultCompanyId() {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM ${tableSql("companies")} ORDER BY created_at ASC LIMIT 1`
  );

  return result.rows[0]?.id ?? demoCompanyId;
}

export async function initializeAuthStore() {
  if (!config.databaseUrl) {
    throw new Error("DATABASE_URL is required for HumanTouch auth");
  }

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${schemaSql}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableSql("companies")} (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableSql("users")} (
      id UUID PRIMARY KEY,
      company_id UUID NOT NULL REFERENCES ${tableSql("companies")}(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      role_key TEXT NOT NULL,
      is_admin BOOLEAN NOT NULL,
      auth_provider TEXT NOT NULL,
      password_hash TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${tableSql("auth_sessions")} (
      id UUID PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES ${tableSql("users")}(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      last_seen_at TIMESTAMPTZ NOT NULL
    )
  `);

  await seedDemoCompanyAndAdmin();
}

async function seedDemoCompanyAndAdmin() {
  const createdAt = nowIso();
  await pool.query(
    `
      INSERT INTO ${tableSql("companies")} (id, name, slug, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $4)
      ON CONFLICT (slug) DO NOTHING
    `,
    [demoCompanyId, "HumanTouch Demo Company", "humantouch-demo", createdAt]
  );

  const email = normalizeEmail(process.env.DEV_ADMIN_EMAIL ?? "admin@humantouch.local");
  const existing = await pool.query(
    `SELECT id FROM ${tableSql("users")} WHERE email = $1 LIMIT 1`,
    [email]
  );

  if (existing.rowCount) return;

  await pool.query(
    `
      INSERT INTO ${tableSql("users")} (
        id,
        company_id,
        email,
        full_name,
        role_key,
        is_admin,
        auth_provider,
        password_hash,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, true, 'local', $6, $7, $7)
    `,
    [
      randomUUID(),
      await getDefaultCompanyId(),
      email,
      process.env.DEV_ADMIN_NAME ?? "HumanTouch Admin",
      "admin",
      await hashPassword(process.env.DEV_ADMIN_PASSWORD ?? "password123"),
      createdAt
    ]
  );
}

export async function createUser(input: {
  email: string;
  fullName: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const createdAt = nowIso();
  const companyId = await getDefaultCompanyId();
  const hasUsers = await pool.query(`SELECT 1 FROM ${tableSql("users")} LIMIT 1`);
  const isFirstUser = !hasUsers.rowCount;

  try {
    const result = await pool.query<DbUser>(
      `
        INSERT INTO ${tableSql("users")} (
          id,
          company_id,
          email,
          full_name,
          role_key,
          is_admin,
          auth_provider,
          password_hash,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'local', $7, $8, $8)
        RETURNING id, company_id, email, full_name, role_key, is_admin, auth_provider, password_hash
      `,
      [
        randomUUID(),
        companyId,
        email,
        input.fullName.trim(),
        isFirstUser ? "admin" : "employee",
        isFirstUser,
        await hashPassword(input.password),
        createdAt
      ]
    );

    return { ok: true as const, user: toPublicUser(result.rows[0]) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false as const, reason: "email_exists" as const };
    }

    throw error;
  }
}

export async function verifyUserCredentials(emailInput: string, password: string) {
  const email = normalizeEmail(emailInput);
  const result = await pool.query<DbUser>(
    `
      SELECT id, company_id, email, full_name, role_key, is_admin, auth_provider, password_hash
      FROM ${tableSql("users")}
      WHERE email = $1 AND auth_provider = 'local'
      LIMIT 1
    `,
    [email]
  );
  const user = result.rows[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return null;
  }

  return toPublicUser(user);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const createdAt = nowIso();
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();
  const tokenHash = hashToken(token);
  const sessionId = randomUUID();

  await pool.query(
    `
      INSERT INTO ${tableSql("auth_sessions")} (
        id,
        user_id,
        token_hash,
        expires_at,
        created_at,
        last_seen_at
      )
      VALUES ($1, $2, $3, $4, $5, $5)
    `,
    [sessionId, userId, tokenHash, expiresAt, createdAt]
  );

  return { token, maxAgeSeconds: sessionMaxAgeSeconds };
}

export async function getUserBySessionToken(token: string | undefined) {
  if (!token) return null;

  const tokenHash = hashToken(token);
  const result = await pool.query<DbUser & { token_hash: string; expires_at: Date }>(
    `
      SELECT
        users.id,
        users.company_id,
        users.email,
        users.full_name,
        users.role_key,
        users.is_admin,
        users.auth_provider,
        users.password_hash,
        auth_sessions.token_hash,
        auth_sessions.expires_at
      FROM ${tableSql("auth_sessions")} auth_sessions
      INNER JOIN ${tableSql("users")} users ON users.id = auth_sessions.user_id
      WHERE auth_sessions.token_hash = $1
      LIMIT 1
    `,
    [tokenHash]
  );
  const row = result.rows[0];

  if (!row) return null;

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await pool.query(`DELETE FROM ${tableSql("auth_sessions")} WHERE token_hash = $1`, [tokenHash]);
    return null;
  }

  await pool.query(
    `UPDATE ${tableSql("auth_sessions")} SET last_seen_at = $1 WHERE token_hash = $2`,
    [nowIso(), tokenHash]
  );

  return toPublicUser(row);
}

export async function deleteSession(token: string | undefined) {
  if (!token) return;

  await pool.query(`DELETE FROM ${tableSql("auth_sessions")} WHERE token_hash = $1`, [
    hashToken(token)
  ]);
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
