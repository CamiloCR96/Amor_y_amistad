export type Participant = { slug: string; name: string };

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

export function findParticipant(slug: string): Participant | null {
  return participants.find((p) => p.slug === slug) ?? null;
}

export function publicPeople(): Participant[] {
  return participants.map(({ slug, name }) => ({ slug, name }));
}
