import SetupNotice from "@/components/SetupNotice";
import SorteoExperience, { type SorteoInitial } from "@/components/SorteoExperience";
import { targetOf } from "@/lib/draw";
import { getCriticalIssues } from "@/lib/env";
import { formatBogota } from "@/lib/format";
import { participants } from "@/lib/participants";
import { getAllReveals } from "@/lib/reveals";
import { getMe } from "@/lib/session";

// Depende de la cookie y del registro de revelaciones, asi que se arma en cada visita.
export const dynamic = "force-dynamic";

export default async function Home() {
  const issues = getCriticalIssues();
  if (issues.length) return <SetupNotice issues={issues} />;

  const slugs = participants.map((p) => p.slug);
  const reveals = await getAllReveals(slugs);
  const me = await getMe();

  // El destino solo viaja al navegador si esta cookie ya revelo. Nunca antes.
  let initial: SorteoInitial = { revealed: false };
  const myReveal = me ? reveals.get(me.slug) : null;
  if (me && myReveal) {
    const target = targetOf(me.slug);
    initial = {
      revealed: true,
      me: { slug: me.slug, name: me.name },
      target: { slug: target.slug, name: target.name },
      atLabel: formatBogota(myReveal),
    };
  }

  const people = participants.map((p) => ({
    slug: p.slug,
    name: p.name,
    taken: Boolean(reveals.get(p.slug)),
  }));

  return <SorteoExperience people={people} initial={initial} />;
}
