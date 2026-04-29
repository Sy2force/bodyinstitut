/**
 * Edge-compatible auth: HMAC-SHA256 signed session token.
 * No DB session needed (stateless cookie).
 *
 * ENV:
 *   ADMIN_USERNAME   default: admin
 *   ADMIN_PASSWORD   default: bodyinstitut (DEV ONLY — change in prod!)
 *   AUTH_SECRET      32+ char random; if missing, derived from ADMIN_PASSWORD (dev)
 */

export const COOKIE_NAME = "bi_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  sub: string; // username
  iat: number;
  exp: number;
}

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 24) return s;
  const fallback = process.env.ADMIN_PASSWORD || "bodyinstitut-dev-secret";
  return `bi-${fallback}-${fallback.length}`.padEnd(32, "x");
}

function getCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || "admin",
    password: process.env.ADMIN_PASSWORD || "bodyinstitut",
  };
}

/* ────────── encoding helpers (edge-safe) ────────── */

function bytesToB64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlToBytes(s: string): Uint8Array {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const base = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function hmac(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return new Uint8Array(sig);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i];
  return r === 0;
}

/* ────────── session ────────── */

export async function signSession(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
  };
  const body = bytesToB64Url(enc.encode(JSON.stringify(payload)));
  const sig = bytesToB64Url(await hmac(getSecret(), body));
  return `${body}.${sig}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = await hmac(getSecret(), body);
  const provided = b64UrlToBytes(sig);
  if (!timingSafeEqual(expected, provided)) return null;

  try {
    const payload = JSON.parse(dec.decode(b64UrlToBytes(body))) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const c = getCredentials();
  // length-safe compare on strings
  if (username.length !== c.username.length) return false;
  if (password.length !== c.password.length) return false;
  let r = 0;
  for (let i = 0; i < username.length; i++)
    r |= username.charCodeAt(i) ^ c.username.charCodeAt(i);
  for (let i = 0; i < password.length; i++)
    r |= password.charCodeAt(i) ^ c.password.charCodeAt(i);
  return r === 0;
}

export function buildCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function clearCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`;
}
