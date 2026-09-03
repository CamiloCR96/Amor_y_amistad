import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RevealExperience, { type InitialState } from "@/components/RevealExperience";
import SetupNotice from "@/components/SetupNotice";
import { targetOf } from "@/lib/draw";
import { getCriticalIssues } from "@/lib/env";
import { formatBogota } from "@/lib/format";
import { publicPeople } from "@/lib/participants";
import { getRevealState } from "@/lib/reveals";
import { participantFromToken } from "@/lib/tokens";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (getCriticalIssues().length) return { title: "Configuración pendiente" };
  const { token } = await params;
  const me = participantFromToken(token);
  return {
    title: me ? `Un mensaje para ${me.name} 💌` : "Enlace no válido",
    description: me ? "Tu conexión secreta de Amor y Amistad te espera." : undefined,
  };
}

export default async function RevealPage({ params }: Props) {
  const issues = getCriticalIssues();
  if (issues.length) return <SetupNotice issues={issues} />;

  const { token } = await params;
  const me = participantFromToken(token);
  if (!me) notFound();

  const state = await getRevealState(me.slug);
  const initial: InitialState = state
    ? (() => {
        const target = targetOf(me.slug);
        return {
          revealed: true,
          target: { slug: target.slug, name: target.name },
          atLabel: formatBogota(state.at),
        };
      })()
    : { revealed: false };

  return (
    <RevealExperience
      token={token.toLowerCase()}
      me={{ slug: me.slug, name: me.name }}
      people={publicPeople()}
      initial={initial}
    />
  );
}
