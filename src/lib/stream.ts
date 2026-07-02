import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import path from "path";

// Raíz del contenido protegido: fuera de public/, nunca servido estáticamente.
export const MEDIA_ROOT = path.join(process.cwd(), "media");
export const HLS_ROOT = path.join(MEDIA_ROOT, "hls");
export const KEYS_ROOT = path.join(MEDIA_ROOT, "keys");

export const SESSION_COOKIE = "cnx_sid";
const TOKEN_TTL_SECONDS = 15 * 60;

function secret(): string {
  const s = process.env.STREAM_SECRET;
  if (!s) throw new Error("STREAM_SECRET no está definido en .env.local");
  return s;
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

// El id de pista viaja en la URL: solo aceptamos ids simples (sin / ni ..)
export function isSafeId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function isSafeSegmentName(name: string): boolean {
  return /^seg_\d{1,5}\.ts$/.test(name);
}

// --- Sesión de reproducción (cookie httpOnly firmada) ---

export function newSessionId(): string {
  const id = randomBytes(16).toString("hex");
  return `${id}.${hmac(`sid:${id}`)}`;
}

export function isValidSessionId(value: string | undefined): value is string {
  if (!value) return false;
  const [id, sig] = value.split(".");
  if (!id || !sig) return false;
  const expected = hmac(`sid:${id}`);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// --- Tokens de acceso (clave y segmentos), ligados a pista + sesión + expiración ---

export function signToken(trackId: string, sessionId: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const sig = hmac(`tk:${trackId}:${sessionId}:${exp}`);
  return `${exp}.${sig}`;
}

export function verifyToken(
  token: string | null,
  trackId: string,
  sessionId: string
): boolean {
  if (!token) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = hmac(`tk:${trackId}:${sessionId}:${exp}`);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// --- Límite de peticiones de clave por sesión (frena scrapers masivos) ---

const keyRequests = new Map<string, number[]>();
const KEY_RATE_LIMIT = 30; // claves por minuto por sesión

export function allowKeyRequest(sessionId: string): boolean {
  const now = Date.now();
  const recent = (keyRequests.get(sessionId) ?? []).filter(
    (t) => now - t < 60_000
  );
  if (recent.length >= KEY_RATE_LIMIT) return false;
  recent.push(now);
  keyRequests.set(sessionId, recent);
  if (keyRequests.size > 10_000) keyRequests.clear();
  return true;
}

export const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const;
