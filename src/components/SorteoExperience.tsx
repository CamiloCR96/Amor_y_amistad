"use client";

import { useCallback, useEffect, useState } from "react";
import { claimAction, forgetMeAction, type ClaimResult } from "@/app/actions";
import Graph, { type GraphPerson } from "./Graph";
import GiftBanner from "./GiftBanner";
import HeartBurst from "./HeartBurst";
import NamePicker, { type PickablePerson } from "./NamePicker";
import { cx } from "./cx";

type Target = { slug: string; name: string };

export type SorteoInitial =
  | { revealed: false }
  | { revealed: true; me: GraphPerson; target: Target; atLabel: string };

type Props = {
  people: PickablePerson[];
  initial: SorteoInitial;
};

type Phase = "picking" | "confirm" | "loading" | "revealed" | "taken" | "error";

type Done = { me: GraphPerson; target: Target; atLabel: string; first: boolean };

export default function SorteoExperience({ people, initial }: Props) {
  const [phase, setPhase] = useState<Phase>(initial.revealed ? "revealed" : "picking");
  const [done, setDone] = useState<Done | null>(
    initial.revealed
      ? { me: initial.me, target: initial.target, atLabel: initial.atLabel, first: false }
      : null,
  );
  const [pendingSlug, setPendingSlug] = useState<string | null>(null);
  const [takenLabel, setTakenLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [burst, setBurst] = useState(false);

  const graphPeople: GraphPerson[] = people.map(({ slug, name }) => ({ slug, name }));
  const pendingPerson = people.find((p) => p.slug === pendingSlug) ?? null;

  const confirm = useCallback(async () => {
    if (!pendingPerson) return;
    setPhase("loading");
    try {
      const res: ClaimResult = await claimAction(pendingPerson.slug);
      if (res.ok) {
        setDone({
          me: { slug: pendingPerson.slug, name: pendingPerson.name },
          target: res.target,
          atLabel: res.atLabel,
          first: res.first,
        });
        setPhase("revealed");
        return;
      }
      if (res.reason === "tomado") {
        setTakenLabel(res.atLabel);
        setPhase("taken");
        return;
      }
      setErrorMsg(
        res.reason === "no-existe"
          ? "Ese nombre ya no está en la lista."
          : "La página todavía no está configurada. Avísale al organizador.",
      );
      setPhase("error");
    } catch {
      setErrorMsg("No pudimos guardar tu elección. Revisa tu conexión e intenta otra vez.");
      setPhase("error");
    }
  }, [pendingPerson]);

  // Lluvia de corazones cuando termina de dibujarse la linea.
  useEffect(() => {
    if (phase !== "revealed" || !done?.first) return;
    const timer = window.setTimeout(() => setBurst(true), 2000);
    return () => window.clearTimeout(timer);
  }, [phase, done]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("picking");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const revealed = phase === "revealed" && done ? done : null;
  const animated = Boolean(revealed?.first);

  return (
    <>
      <p className="sr-only" role="status" aria-live="polite">
        {revealed ? `Tu conexión es ${revealed.target.name}.` : ""}
      </p>

      <header className={cx("hero", revealed && "hero-compact")}>
        <p className="eyebrow">Septiembre · Celebración secreta</p>
        {revealed ? (
          <h1 className="title title-sm">
            Hola, <em>{revealed.me.name}</em>
          </h1>
        ) : (
          <h1 className="title">
            Amor <em>y</em> Amistad
          </h1>
        )}
        <p className="lede">
          {revealed
            ? revealed.first
              ? "Ya quedó. Esta es tu persona."
              : "Ya revelaste tu conexión. Aquí la tienes otra vez, por si la memoria falla."
            : `Una red de conexiones secretas entre ${people.length} personas. Encuentra tu nombre y descubre a quién te toca consentir.`}
        </p>
      </header>

      <section className="stage">
        <Graph
          people={graphPeople}
          mode="reveal"
          meSlug={revealed?.me.slug}
          reveal={revealed ? { from: revealed.me.slug, to: revealed.target.slug } : null}
        />
        {!revealed && (
          <p className="hint">
            Las líneas que ves son puro despiste. La tuya aparece cuando elijas tu nombre.
          </p>
        )}
      </section>

      {revealed && (
        <section className={cx("reveal-panel", animated && "reveal-panel-animated")}>
          <GiftBanner />
          <div className="card reveal-card">
            <p className="card-kicker">Tu conexión de Amor y Amistad es</p>
            <p className="reveal-name">{revealed.target.name}</p>
            <p className="reveal-copy">
              Te toca consentir a <strong>{revealed.target.name}</strong>. Shhh, es un secreto entre este
              teléfono y tú.
            </p>
            <p className="reveal-meta">
              {revealed.first ? "Revelado justo ahora" : `Revelado el ${revealed.atLabel}`} · Ya quedó
              registrado y no cambia. Puedes volver a abrir esta página si se te olvida.
            </p>
          </div>
        </section>
      )}

      {!revealed && phase !== "taken" && phase !== "error" && (
        <section className="stack">
          <GiftBanner />
          <NamePicker
            people={people}
            disabled={phase === "loading"}
            onPick={(slug) => {
              setPendingSlug(slug);
              setPhase("confirm");
            }}
          />
        </section>
      )}

      {phase === "taken" && (
        <section className="stack">
          <div className="card setup">
            <p className="card-kicker">Ese nombre ya está tomado</p>
            <h2 className="modal-title">
              {pendingPerson?.name} ya reveló su conexión
            </h2>
            <p className="modal-copy">
              Pasó el {takenLabel}, desde otro teléfono. Si de verdad eres tú y no fuiste quien lo abrió,
              avísale al organizador: él puede reiniciar tu casilla para que la veas.
            </p>
            <button type="button" className="btn btn-ghost" onClick={() => setPhase("picking")}>
              Volver a la lista
            </button>
          </div>
        </section>
      )}

      {phase === "error" && (
        <section className="stack">
          <div className="card setup">
            <p className="card-kicker">Algo salió mal</p>
            <p className="modal-copy">{errorMsg}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setPhase("picking")}>
              Volver a la lista
            </button>
          </div>
        </section>
      )}

      {phase === "confirm" && pendingPerson && (
        <div className="modal-backdrop" onClick={() => setPhase("picking")}>
          <div
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-kicker">Un segundo</p>
            <h2 id="confirm-title" className="modal-title">
              ¿Eres <em>{pendingPerson.name}</em>?
            </h2>
            <p className="modal-copy">
              Si dices que sí, se revela tu conexión y queda registrada. Nadie más va a poder verla y no se
              puede cambiar.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPhase("picking")}>
                No soy yo
              </button>
              <button type="button" className="btn btn-primary" onClick={confirm} autoFocus>
                Sí, soy yo
              </button>
            </div>
          </div>
        </div>
      )}

      {revealed && (
        <p className="note">
          ¿Prestaste el teléfono y necesitas que otro entre?{" "}
          <button
            type="button"
            className="picker-help-link"
            onClick={async () => {
              await forgetMeAction();
              window.location.reload();
            }}
          >
            Salir de esta sesión
          </button>
        </p>
      )}

      {burst && <HeartBurst />}
    </>
  );
}
