import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "kt_admin";

function sign(value: string) {
  const secret = process.env.ADMIN_PASSWORD ?? "dev-admin";
  return createHmac("sha256", secret).update(value).digest("hex");
}

export async function isAdminAuthenticated() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return false;
  const expected = sign("ok");
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function setAdminSession() {
  const jar = await cookies();
  jar.set(COOKIE, sign("ok"), {
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
  const expected = process.env.ADMIN_PASSWORD ?? "admin";
  return password === expected;
}
