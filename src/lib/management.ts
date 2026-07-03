import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

// Autenticación mínima del panel de administración: una sola contraseña
// (MANAGEMENT_PASSWORD) y una cookie de sesión firmada con HMAC. Sin base de
// usuarios "por ahora", como se pidió.

export const MGMT_COOKIE = "cnx_mgmt";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas

function secret(): string {
  const s = process.env.STREAM_SECRET;
  if (!s) throw new Error("STREAM_SECRET no está definido en .env.local");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function checkPassword(password: string): boolean {
  const expected = process.env.MANAGEMENT_PASSWORD;
  if (!expected) throw new Error("MANAGEMENT_PASSWORD no está definido en .env.local");
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// Token de sesión: expiración + firma. No guarda estado en servidor.
export function newSessionToken(): string {
  const exp = Date.now() + SESSION_TTL_MS;
  return `${exp}.${sign(`mgmt:${exp}`)}`;
}

export function isValidSessionToken(value: string | undefined): boolean {
  if (!value) return false;
  const [expStr, sig] = value.split(".");
  const exp = Number(expStr);
  if (!exp || !sig || exp < Date.now()) return false;
  const expected = sign(`mgmt:${exp}`);
  if (sig.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}

// Comprueba la cookie de sesión en una request de API.
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return isValidSessionToken(store.get(MGMT_COOKIE)?.value);
}
