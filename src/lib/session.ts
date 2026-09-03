import { cookies } from "next/headers";
import { hmacHex, safeEqual } from "./crypto";
import { getAppSecret } from "./env";
import { findParticipant, type Participant } from "./participants";

const COOKIE = "aya_yo";
const DAYS = 60;

// Firma el slug para que nadie pueda editarse la cookie y volverse otra persona.
function sign(slug: string): string {
  return hmacHex(getAppSecret(), `yo:${slug}`).slice(0, 24);
}

// Quien dijo ser esta persona en este dispositivo. Null si nadie.
export async function getMe(): Promise<Participant | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  const sep = raw.lastIndexOf(".");
  if (sep <= 0) return null;
  const slug = raw.slice(0, sep);
  const sig = raw.slice(sep + 1);
  const person = findParticipant(slug);
  if (!person) return null;
  return safeEqual(sig, sign(slug)) ? person : null;
}

export async function setMe(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, `${slug}.${sign(slug)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 24 * 60 * 60,
  });
}

export async function clearMe(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}
