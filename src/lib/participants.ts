export type Participant = { slug: string; name: string };
export type FixedEdge = { from: string; to: string };

// Edita esta lista con las personas reales.
// - name: como quieres que se vea dentro del nodo (corto funciona mejor).
// - slug: identificador unico, en minusculas, sin espacios ni tildes.
//   Se usa para firmar el enlace personal de cada quien. No lo cambies
//   despues de repartir los enlaces, porque el enlace dejaria de servir.
export const participants: Participant[] = [
  { slug: "adriana", name: "Adriana" },
  { slug: "valeria", name: "Valeria" },
  { slug: "aurorita", name: "Aurorita" },
  { slug: "ariel", name: "Ariel" },
  { slug: "lilibeth", name: "Lilibeth" },
  { slug: "melanie", name: "Melanie" },
  { slug: "lilia", name: "Lilia" },
  { slug: "sergio", name: "Sergio" },
  { slug: "gustavo", name: "Gustavo" },
  { slug: "diego", name: "Diego" },
  { slug: "esteban", name: "Esteban" },
  { slug: "liney", name: "Liney" },
  { slug: "fabian", name: "Fabián" },
  { slug: "karina", name: "Karina" },
  { slug: "rafael", name: "Rafael" },
  { slug: "juan-carlos", name: "Juan Carlos" },
  { slug: "camilo", name: "Camilo" },
  { slug: "keiler", name: "Keiler" },
];

// Conexiones amarradas a mano. Todo lo que no este aqui se reparte al azar.
// "from le regala a to". Una persona solo puede aparecer una vez como `from`
// y una vez como `to`.
export const fixedEdges: FixedEdge[] = [
  { from: "camilo", to: "valeria" },
  { from: "sergio", to: "camilo" },
];

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;

export function participantIssues(list: Participant[]): string[] {
  const issues: string[] = [];
  if (list.length < 3) {
    issues.push("Se necesitan al menos 3 participantes para hacer el sorteo.");
  }
  const seen = new Set<string>();
  for (const p of list) {
    if (!SLUG_RE.test(p.slug)) {
      issues.push(`El slug "${p.slug}" no es valido: usa minusculas, numeros o guiones.`);
    }
    if (seen.has(p.slug)) {
      issues.push(`El slug "${p.slug}" esta repetido.`);
    }
    seen.add(p.slug);
    if (!p.name.trim()) {
      issues.push(`El participante "${p.slug}" no tiene nombre.`);
    }
  }
  return issues;
}

export function fixedEdgeIssues(list: Participant[], edges: FixedEdge[]): string[] {
  const issues: string[] = [];
  const known = new Set(list.map((p) => p.slug));
  const givers = new Set<string>();
  const receivers = new Set<string>();

  for (const e of edges) {
    if (!known.has(e.from)) issues.push(`Conexion fija invalida: no existe "${e.from}".`);
    if (!known.has(e.to)) issues.push(`Conexion fija invalida: no existe "${e.to}".`);
    if (e.from === e.to) issues.push(`Conexion fija invalida: "${e.from}" no puede regalarse a si mismo.`);
    if (givers.has(e.from)) issues.push(`"${e.from}" aparece dos veces dando regalo en las conexiones fijas.`);
    if (receivers.has(e.to)) issues.push(`"${e.to}" aparece dos veces recibiendo regalo en las conexiones fijas.`);
    givers.add(e.from);
    receivers.add(e.to);
  }

  // Si solo queda una persona libre, podria verse obligada a regalarse a si misma.
  const freeGivers = list.filter((p) => !givers.has(p.slug)).map((p) => p.slug);
  const freeReceivers = list.filter((p) => !receivers.has(p.slug)).map((p) => p.slug);
  if (freeGivers.length === 1 && freeReceivers.length === 1 && freeGivers[0] === freeReceivers[0]) {
    issues.push(
      `Las conexiones fijas dejan a "${freeGivers[0]}" sin opcion: tendria que regalarse a si mismo. Suelta alguna.`,
    );
  }
  return issues;
}

export function findParticipant(slug: string): Participant | null {
  return participants.find((p) => p.slug === slug) ?? null;
}

export function publicPeople(): Participant[] {
  return participants.map(({ slug, name }) => ({ slug, name }));
}
