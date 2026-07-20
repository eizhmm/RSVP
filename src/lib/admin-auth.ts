import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "kt_admin";

function adminSecret(): string | null {
  const secret = process.env.ADMIN_PASSWORD?.trim();
  return secret ? secret : null;
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function isAdminAuthenticated() {
  const secret = adminSecret();
  if (!secret) return false;

  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;

  const expected = sign("ok", secret);
  try {
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  const secret = adminSecret();
  if (!secret) {
    throw new Error("ADMIN_PASSWORD is not configured");
  }

  const jar = await cookies();
  jar.set(COOKIE, sign("ok", secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function verifyAdminPassword(password: string) {
  const expected = adminSecret();
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
