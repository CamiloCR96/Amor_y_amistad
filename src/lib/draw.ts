import { hmacHex } from "./crypto";
import { getDrawSeed } from "./env";
import { participantIssues, participants, type Participant } from "./participants";

export type Draw = {
  id: string;
  targetOf: Map<string, string>;
  giverOf: Map<string, string>;
};

// Entero determinista en [0, max) derivado de la semilla y la ronda.
function randBelow(seed: string, round: number, max: number): number {
  const hex = hmacHex(seed, `round:${round}`).slice(0, 8);
  return parseInt(hex, 16) % max;
}

let cached: { seed: string; count: number; draw: Draw } | null = null;

// Sorteo con el algoritmo de Sattolo: produce un unico ciclo, asi que
// nadie se regala a si mismo, no hay parejas mutuas (con 3 o mas personas)
// y todos dan y reciben exactamente un regalo.
export function getDraw(): Draw {
  const seed = getDrawSeed();
  if (cached && cached.seed === seed && cached.count === participants.length) {
    return cached.draw;
  }
  const issues = participantIssues(participants);
  if (issues.length) throw new Error(issues.join(" "));

  const n = participants.length;
  const a = participants.map((_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = randBelow(seed, i, i);
    [a[i], a[j]] = [a[j], a[i]];
  }

  const targetOf = new Map<string, string>();
  const giverOf = new Map<string, string>();
  participants.forEach((p, i) => {
    const target = participants[a[i]];
    targetOf.set(p.slug, target.slug);
    giverOf.set(target.slug, p.slug);
  });

  // El id incluye la lista: si agregas, quitas o reordenas gente, cambia el id
  // y las revelaciones viejas dejan de contar en vez de apuntar a otra persona.
  const roster = participants.map((p) => p.slug).join(",");
  const draw: Draw = { id: hmacHex(seed, `draw-id:${n}:${roster}`).slice(0, 8), targetOf, giverOf };
  cached = { seed, count: n, draw };
  return draw;
}

export function targetOf(slug: string): Participant {
  const targetSlug = getDraw().targetOf.get(slug);
  const target = participants.find((p) => p.slug === targetSlug);
  if (!target) throw new Error(`No hay conexion para ${slug}`);
  return target;
}
