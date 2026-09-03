import { cookies, headers } from "next/headers";
import { hmacHex, safeEqual } from "./crypto";
import { getAdminPassword, getAppSecret } from "./env";
import { getStore } from "./store";

export const ADMIN_COOKIE = "aya_admin";
const SESSION_DAYS = 7;
const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

function sessionValue(): string | null {
  const password = getAdminPassword();
  if (!password) return null;
  return hmacHex(getAppSecret(), `admin-session:${password}`);
}

export async function isAdmin(): Promise<boolean> {
  const expected = sessionValue();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(ADMIN_COOKIE)?.value;
  return Boolean(got && safeEqual(got, expected));
}

async function clientIp(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}

export type LoginResult = "ok" | "wrong" | "locked" | "disabled";

export async function tryLogin(password: string): Promise<LoginResult> {
  const expected = getAdminPassword();
  if (!expected) return "disabled";

  const ip = await clientIp();
  const attempts = await getStore().incrWithTtl(`aya:login-fail:${ip}`, WINDOW_SECONDS);
  if (attempts > MAX_ATTEMPTS) return "locked";

  if (!safeEqual(password, expected)) return "wrong";

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, sessionValue()!, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return "ok";
}

export async function logoutAdmin(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
}
