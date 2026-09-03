"use server";

import { targetOf } from "@/lib/draw";
import { getCriticalIssues } from "@/lib/env";
import { formatBogota } from "@/lib/format";
import { findParticipant } from "@/lib/participants";
import { getRevealState, reveal } from "@/lib/reveals";
import { clearMe, getMe, setMe } from "@/lib/session";

export type ClaimResult =
  | { ok: true; target: { slug: string; name: string }; atLabel: string; first: boolean }
  // Alguien ya reclamo ese nombre desde otro celular.
  | { ok: false; reason: "tomado"; atLabel: string }
  | { ok: false; reason: "no-existe" }
  | { ok: false; reason: "sin-configurar" };

// Una persona dice quien es y ve su conexion. Solo la primera vez cuenta:
// despues, solo el mismo dispositivo puede volver a verla.
export async function claimAction(slug: string): Promise<ClaimResult> {
  if (getCriticalIssues().length) return { ok: false, reason: "sin-configurar" };

  const person = findParticipant(String(slug ?? ""));
  if (!person) return { ok: false, reason: "no-existe" };

  const already = await getRevealState(person.slug);
  const me = await getMe();

  // Si ya lo revelaron y no fue en este dispositivo, no se muestra.
  if (already && me?.slug !== person.slug) {
    return { ok: false, reason: "tomado", atLabel: formatBogota(already.at) };
  }

  const target = targetOf(person.slug);
  const { at, first } = await reveal(person.slug);
  await setMe(person.slug);

  return {
    ok: true,
    target: { slug: target.slug, name: target.name },
    atLabel: formatBogota(at),
    first,
  };
}

// Para probar desde otro nombre en el mismo navegador.
export async function forgetMeAction(): Promise<void> {
  await clearMe();
}
