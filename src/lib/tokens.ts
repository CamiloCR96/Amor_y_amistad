import { hmacHex, safeEqual } from "./crypto";
import { getAppSecret } from "./env";
import { participants, type Participant } from "./participants";

const TOKEN_RE = /^[a-f0-9]{32}$/;

// 32 hex = 128 bits firmados con el secreto: imposible de adivinar.
export function tokenFor(slug: string): string {
  return hmacHex(getAppSecret(), `link:${slug}`).slice(0, 32);
}

export function participantFromToken(raw: string): Participant | null {
  const token = raw.trim().toLowerCase();
  if (!TOKEN_RE.test(token)) return null;
  for (const p of participants) {
    if (safeEqual(tokenFor(p.slug), token)) return p;
  }
  return null;
}
