"use client";

import { useCallback, useEffect, useState } from "react";
import Graph, { type GraphPerson } from "./Graph";
import GiftBanner from "./GiftBanner";
import HeartBurst from "./HeartBurst";
import { cx } from "./cx";

type Target = { slug: string; name: string };

export type InitialState =
  | { revealed: false }
  | { revealed: true; target: Target; atLabel: string };

type Props = {
  token: string;
  me: GraphPerson;
  people: GraphPerson[];
  initial: InitialState;
};

type Phase = "idle" | "confirm" | "loading" | "revealed" | "error";
type Result = { target: Target; atLabel: string; first: boolean };

export default function RevealExperience({ token, me, people, initial }: Props) {
  const [phase, setPhase] = useState<Phase>(initial.revealed ? "revealed" : "idle");
  const [result, setResult] = useState<Result | null>(
    initial.revealed ? { target: initial.target, atLabel: initial.atLabel, first: false } : null,
  );
  const [burst, setBurst] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const doReveal = useCallback(async () => {
    setPhase("loading");
    try {
      const res = await fetch("/api/reveal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        throw new Error(
          res.status === 404 ? "Este enlace ya no es válido." : "No pudimos revelar tu conexión. Intenta de nuevo.",
        );
      }
      const data = (await res.json()) as { target: Target; atLabel: string; first: boolean };
      setResult({ target: data.target, atLabel: data.atLabel, first: data.first });
      setPhase("revealed");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo.");
      setPhase("error");
    }
  }, [token]);

  // Lluvia de corazones cuando termina de dibujarse la linea.
  useEffect(() => {
    if (phase !== "revealed" || !result?.first) return;
    const timer = window.setTimeout(() => setBurst(true), 2000);
    return () => window.clearTimeout(timer);
  }, [phase, result]);

  useEffect(() => {
    if (phase !== "confirm") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPhase("idle");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  const revealed = phase === "revealed" && result ? result : null;
  const animated = Boolean(revealed?.first);

  return (
    <>
      {/* Siempre montada: si la region naciera junto con el texto, el lector
          de pantalla no anunciaria nada. */}
      <p className="sr-only" role="status" aria-live="polite">
        {revealed ? `Tu conexión es ${revealed.target.name}.` : ""}
      </p>

      <header className="hero hero-compact">
        <p className="eyebrow">Amor y Amistad · Tu enlace personal</p>
        <h1 className="title title-sm">
          Hola, <em>{me.name}</em>
        </h1>
        {!revealed && (
          <p className="lede">
            Este es tu nodo en la red. Cuando quieras, revela tu conexión. Solo se puede hacer una vez y
            queda registrada, así que respira hondo.
          </p>
        )}
        {revealed && !revealed.first && (
          <p className="lede">Ya revelaste tu conexión. Aquí la tienes otra vez, por si la memoria falla.</p>
        )}
      </header>

      <section className="stage">
        <Graph
          people={people}
          mode="reveal"
          meSlug={me.slug}
          reveal={revealed ? { from: me.slug, to: revealed.target.slug } : null}
          onSelfClick={phase === "idle" ? () => setPhase("confirm") : undefined}
        />

        {!revealed && phase !== "error" && (
          <div className="cta-row">
            <button
              type="button"
              className="btn btn-primary btn-big"
              onClick={() => setPhase("confirm")}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? "Consultando al destino..." : "Revelar mi conexión"}
            </button>
            <p className="hint">También puedes tocar tu nodo.</p>
          </div>
        )}

        {phase === "error" && (
          <div className="cta-row">
            <p className="error" role="alert">
              {errorMsg}
            </p>
            <button type="button" className="btn btn-ghost" onClick={doReveal}>
              Intentar de nuevo
            </button>
          </div>
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
              enlace y tú.
            </p>
            <p className="reveal-meta">
              {revealed.first ? "Revelado justo ahora" : `Revelado el ${revealed.atLabel}`} · Ya quedó
              registrado y no cambia. Puedes volver a abrir este enlace si se te olvida.
            </p>
          </div>
        </section>
      )}

      {phase === "confirm" && (
        <div className="modal-backdrop" onClick={() => setPhase("idle")}>
          <div
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-kicker">Un segundo</p>
            <h2 id="confirm-title" className="modal-title">
              ¿Revelamos tu conexión?
            </h2>
            <p className="modal-copy">Queda registrada y ya no se puede cambiar. Después de esto no hay marcha atrás.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setPhase("idle")}>
                Todavía no
              </button>
              <button type="button" className="btn btn-primary" onClick={doReveal} autoFocus>
                Sí, revelar
              </button>
            </div>
          </div>
        </div>
      )}

      {burst && <HeartBurst />}
    </>
  );
}
