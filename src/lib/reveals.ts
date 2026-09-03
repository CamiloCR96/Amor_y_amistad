import { getDraw } from "./draw";
import { getStore } from "./store";

type RevealRecord = { at: string };

// La clave incluye el id del sorteo: si cambias la semilla, las revelaciones
// anteriores dejan de contar automaticamente.
function key(slug: string): string {
  return `aya:${getDraw().id}:reveal:${slug}`;
}

export async function getRevealState(slug: string): Promise<RevealRecord | null> {
  const [rec] = await getStore().getMany<RevealRecord>([key(slug)]);
  return rec && typeof rec.at === "string" ? rec : null;
}

export async function reveal(slug: string, now = new Date()): Promise<RevealRecord & { first: boolean }> {
  const attempt: RevealRecord = { at: now.toISOString() };
  const stored = await getStore().setIfAbsent(key(slug), attempt);
  return { at: stored.at, first: stored.at === attempt.at };
}

// Borra el registro de revelacion. Quien lo tenga borrado vuelve a ver el
// boton y puede revelar otra vez. La persona que le toca NO cambia: el
// sorteo se recalcula siempre del secreto.
export async function resetReveals(slugs: string[]): Promise<void> {
  await getStore().deleteMany(slugs.map(key));
}

export async function getAllReveals(slugs: string[]): Promise<Map<string, string | null>> {
  const recs = await getStore().getMany<RevealRecord>(slugs.map(key));
  return new Map(slugs.map((s, i) => [s, recs[i]?.at ?? null]));
}
