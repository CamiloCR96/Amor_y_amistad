"use client";

import { useState } from "react";
import Graph from "./Graph";
import CopyButton from "./CopyButton";
import GiftBanner from "./GiftBanner";
import { logoutAction, resetAllAction, resetOneAction } from "@/app/admin/actions";

export type AdminRow = {
  slug: string;
  name: string;
  targetSlug: string;
  targetName: string;
  link: string;
  revealedLabel: string | null;
};

type Props = {
  rows: AdminRow[];
  drawId: string;
  warnings: string[];
  storeKind: "redis" | "memory";
  notice: string | null;
  groupLink: string;
};

function messageFor(row: AdminRow): string {
  return [
    `Hola ${row.name} 💌`,
    `Este es tu enlace personal de Amor y Amistad: ${row.link}`,
    "Ábrelo cuando quieras. Es solo tuyo, no lo compartas 😉",
  ].join("\n");
}

export default function AdminDashboard({
  rows,
  drawId,
  warnings,
  storeKind,
  notice,
  groupLink,
}: Props) {
  const [askReset, setAskReset] = useState(false);
  const [showLinks, setShowLinks] = useState(false);
  const revealed = rows.filter((r) => r.revealedLabel).length;
  const people = rows.map((r) => ({ slug: r.slug, name: r.name }));
  const edges = rows.map((r) => ({ from: r.slug, to: r.targetSlug }));
  const groupMessage = [
    "Feliz mes de Amor y Amistad 💌",
    "",
    "Abran este link, busquen su nombre y ahí les sale a quién le tienen que dar:",
    groupLink,
    "",
    "Cada quien elige el suyo una sola vez, así que ojo con no tocar el nombre de otro 😅",
    "Y ya saben: el regalo es de 30 mil pesos para arriba.",
  ].join("\n");

  return (
    <>
      <header className="hero hero-compact admin-head">
        <div>
          <p className="eyebrow">Panel del organizador</p>
          <h1 className="title title-sm">
            Todas las <em>conexiones</em>
          </h1>
          <p className="lede">
            Solo tú ves esta página. Pasa el cursor o toca un nodo para resaltar a quién le regala y quién le
            regala.
          </p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn btn-ghost btn-small">
            Cerrar sesión
          </button>
        </form>
      </header>

      {notice && (
        <p className="notice-ok" role="status">
          {notice}
        </p>
      )}

      {warnings.length > 0 && (
        <ul className="warn-list">
          {warnings.map((w) => (
            <li key={w} className="warn">
              {w}
            </li>
          ))}
        </ul>
      )}

      <section className="stats">
        <div className="stat">
          <span className="stat-value">
            {revealed}
            <small>/{rows.length}</small>
          </span>
          <span className="stat-label">ya revelaron</span>
        </div>
        <div className="stat">
          <span className="stat-value">{rows.length - revealed}</span>
          <span className="stat-label">pendientes</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-mono">{drawId}</span>
          <span className="stat-label">id del sorteo · {storeKind === "redis" ? "Redis" : "memoria"}</span>
        </div>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${rows.length ? (revealed / rows.length) * 100 : 0}%` }} />
        </div>
      </section>

      <section className="stage">
        <Graph people={people} mode="admin" edges={edges} />
      </section>

      <section className="admin-actions">
        <div className="group-link">
          <p className="card-kicker">El enlace para el grupo</p>
          <p className="group-link-url">{groupLink}</p>
          <p className="group-link-copy">
            Este es el único enlace que tienes que mandar. Lo pegas en el grupo, cada quien busca su nombre
            y ve su conexión. Nadie ve la de nadie más.
          </p>
          <div className="group-link-actions">
            <CopyButton
              text={groupMessage}
              label="Copiar mensaje para el grupo"
              copiedLabel="Mensaje copiado"
              className="btn-primary"
            />
            <CopyButton text={groupLink} label="Copiar solo el enlace" />
          </div>
        </div>

        <button type="button" className="picker-help-link" onClick={() => setShowLinks((v) => !v)}>
          {showLinks ? "Ocultar los enlaces privados" : "¿Y los enlaces privados de cada persona?"}
        </button>

        {showLinks && (
          <p className="hint hint-wide">
            Cada quien tiene además un enlace propio que lo identifica solo, sin tener que elegir su nombre.
            Sirve si alguien se equivocó de nombre o si quieres mandárselo aparte a una persona. Están en la
            última columna de la tabla.
          </p>
        )}
      </section>

      <section className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Le regala a</th>
              <th>Estado</th>
              <th>Enlace</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug}>
                <td className="td-name">{r.name}</td>
                <td className="td-target">
                  <span aria-hidden="true">→ </span>
                  {r.targetName}
                </td>
                <td className="td-status">
                  {r.revealedLabel ? (
                    <span className="pill pill-ok">Reveló · {r.revealedLabel}</span>
                  ) : (
                    <span className="pill">Pendiente</span>
                  )}
                </td>
                <td className="td-actions">
                  <CopyButton text={r.link} label="Copiar enlace" />
                  <CopyButton text={messageFor(r)} label="Copiar mensaje" />
                  {r.revealedLabel && (
                    <form action={resetOneAction}>
                      <input type="hidden" name="slug" value={r.slug} />
                      <button type="submit" className="btn btn-small btn-warn">
                        Reiniciar
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="stack">
        <div className="reset-zone">
          <div>
            <p className="reset-title">Reiniciar todo</p>
            <p className="reset-copy">
              Borra el registro de quién ya reveló y todos vuelven a poder elegir su nombre. Sirve para
              hacer pruebas o si algo se enredó. <strong>A nadie le cambia la persona que le tocó</strong>:
              eso se calcula del secreto, no del registro.
            </p>
          </div>
          <button type="button" className="btn btn-warn" onClick={() => setAskReset(true)}>
            Reiniciar los {rows.length} votos
          </button>
        </div>

        <GiftBanner compact />
        <p className="note">
          Para volver a sortear, cambia <code>SORTEO_SEED</code> en Render y vuelve a desplegar. Los enlaces
          siguen siendo los mismos y el registro de revelaciones arranca en cero.
        </p>
      </section>

      {askReset && (
        <div className="modal-backdrop" onClick={() => setAskReset(false)}>
          <div
            className="card modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reset-title"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="card-kicker">Confirma</p>
            <h2 id="reset-title" className="modal-title">
              ¿Reiniciar los {rows.length} votos?
            </h2>
            <p className="modal-copy">
              Todos vuelven a quedar como pendientes y podrán elegir su nombre otra vez. Las parejas del
              sorteo no cambian.
            </p>
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setAskReset(false)}>
                Cancelar
              </button>
              <form action={resetAllAction}>
                <button type="submit" className="btn btn-warn" onClick={() => setAskReset(false)}>
                  Sí, reiniciar todo
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
