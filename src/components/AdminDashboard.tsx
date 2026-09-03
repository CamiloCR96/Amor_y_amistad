"use client";

import Graph from "./Graph";
import CopyButton from "./CopyButton";
import GiftBanner from "./GiftBanner";
import { logoutAction } from "@/app/admin/actions";

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
};

function messageFor(row: AdminRow): string {
  return [
    `Hola ${row.name} 💌`,
    `Este es tu enlace personal de Amor y Amistad: ${row.link}`,
    "Ábrelo cuando quieras. Es solo tuyo, no lo compartas 😉",
  ].join("\n");
}

export default function AdminDashboard({ rows, drawId, warnings, storeKind }: Props) {
  const revealed = rows.filter((r) => r.revealedLabel).length;
  const people = rows.map((r) => ({ slug: r.slug, name: r.name }));
  const edges = rows.map((r) => ({ from: r.slug, to: r.targetSlug }));
  const allMessages = rows.map(messageFor).join("\n\n");

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
        <p className="danger-note">
          <strong>Ojo:</strong> cada enlace es privado. Si pegas varios en un grupo, cualquiera puede abrir el
          de otro y revelarle su conexión. Manda uno por chat individual.
        </p>
        <CopyButton
          text={allMessages}
          label="Copiar la lista completa (para tu bloc de notas)"
          copiedLabel="Lista copiada"
        />
        <p className="hint">
          Para repartir usa el botón <strong>Copiar mensaje</strong> de cada fila y pégalo en su chat.
        </p>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="stack">
        <GiftBanner compact />
        <p className="note">
          Para volver a sortear, cambia <code>SORTEO_SEED</code> en Render y vuelve a desplegar. Los enlaces
          siguen siendo los mismos y el registro de revelaciones arranca en cero.
        </p>
      </section>
    </>
  );
}
