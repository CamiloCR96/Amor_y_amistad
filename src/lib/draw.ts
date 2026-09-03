import { hmacHex } from "./crypto";
import { getDrawSeed } from "./env";
import {
  fixedEdgeIssues,
  fixedEdges,
  participantIssues,
  participants,
  type FixedEdge,
  type Participant,
} from "./participants";

export type Draw = {
  id: string;
  targetOf: Map<string, string>;
  giverOf: Map<string, string>;
  // Cuantas de las reglas de calidad se cumplieron. Sirve para avisar en el panel.
  singleCycle: boolean;
  mutualPairs: number;
};

// Entero determinista en [0, max) a partir de la semilla y una etiqueta.
function randBelow(seed: string, tag: string, max: number): number {
  const hex = hmacHex(seed, tag).slice(0, 8);
  return parseInt(hex, 16) % max;
}

// Baraja determinista (Fisher-Yates).
function shuffled<T>(items: T[], seed: string, tag: string): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randBelow(seed, `${tag}:${i}`, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSingleCycle(targetOf: Map<string, string>, start: string, n: number): boolean {
  let cur = start;
  for (let step = 0; step < n; step++) {
    const next = targetOf.get(cur);
    if (!next) return false;
    cur = next;
    if (cur === start) return step === n - 1;
  }
  return false;
}

function countMutual(targetOf: Map<string, string>): number {
  let mutual = 0;
  for (const [from, to] of targetOf) {
    if (targetOf.get(to) === from) mutual++;
  }
  return mutual;
}

// Reparte los que quedan libres. Devuelve null si en este intento alguien
// se quedaria consigo mismo.
function attempt(
  seed: string,
  round: number,
  edges: FixedEdge[],
  slugs: string[],
): Map<string, string> | null {
  const targetOf = new Map<string, string>();
  const takenGivers = new Set<string>();
  const takenReceivers = new Set<string>();

  for (const e of edges) {
    targetOf.set(e.from, e.to);
    takenGivers.add(e.from);
    takenReceivers.add(e.to);
  }

  const freeGivers = slugs.filter((s) => !takenGivers.has(s));
  const freeReceivers = shuffled(
    slugs.filter((s) => !takenReceivers.has(s)),
    seed,
    `libres:${round}`,
  );

  for (let i = 0; i < freeGivers.length; i++) {
    if (freeGivers[i] === freeReceivers[i]) return null;
    targetOf.set(freeGivers[i], freeReceivers[i]);
  }
  return targetOf;
}

const MAX_ROUNDS = 400;

let cached: { key: string; draw: Draw } | null = null;

// El sorteo respeta las conexiones fijas y reparte el resto al azar.
// Busca, en orden de preferencia:
//   1. un unico ciclo sin parejas mutuas (lo ideal),
//   2. sin parejas mutuas,
//   3. cualquier reparto valido.
// En los tres casos nadie se regala a si mismo y todos dan y reciben una vez.
export function getDraw(): Draw {
  const seed = getDrawSeed();
  const slugs = participants.map((p) => p.slug);
  const edgeKey = fixedEdges.map((e) => `${e.from}>${e.to}`).join(",");
  const key = `${seed}|${slugs.join(",")}|${edgeKey}`;
  if (cached && cached.key === key) return cached.draw;

  const issues = [...participantIssues(participants), ...fixedEdgeIssues(participants, fixedEdges)];
  if (issues.length) throw new Error(issues.join(" "));

  const n = slugs.length;
  let best: Map<string, string> | null = null;
  let bestMutual = Number.POSITIVE_INFINITY;
  let bestCycle = false;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const targetOf = attempt(seed, round, fixedEdges, slugs);
    if (!targetOf) continue;

    const mutual = countMutual(targetOf);
    const cycle = isSingleCycle(targetOf, slugs[0], n);
    if (cycle && mutual === 0) {
      best = targetOf;
      bestMutual = 0;
      bestCycle = true;
      break;
    }
    // Preferimos menos parejas mutuas; a igualdad, el que forme un ciclo unico.
    if (mutual < bestMutual || (mutual === bestMutual && cycle && !bestCycle)) {
      best = targetOf;
      bestMutual = mutual;
      bestCycle = cycle;
    }
  }

  if (!best) {
    throw new Error(
      "No se pudo armar el sorteo con esas conexiones fijas. Revisa que no dejen a alguien sin opciones.",
    );
  }

  const giverOf = new Map<string, string>();
  for (const [from, to] of best) giverOf.set(to, from);

  const draw: Draw = {
    // El id incluye la lista y las conexiones fijas: si cambias cualquiera de
    // las dos, cambia el id y las revelaciones viejas dejan de contar en vez
    // de apuntar a otra persona.
    id: hmacHex(seed, `draw-id:${n}:${slugs.join(",")}:${edgeKey}`).slice(0, 8),
    targetOf: best,
    giverOf,
    singleCycle: bestCycle,
    mutualPairs: bestMutual,
  };
  cached = { key, draw };
  return draw;
}

export function targetOf(slug: string): Participant {
  const targetSlug = getDraw().targetOf.get(slug);
  const target = participants.find((p) => p.slug === targetSlug);
  if (!target) throw new Error(`No hay conexion para ${slug}`);
  return target;
}
