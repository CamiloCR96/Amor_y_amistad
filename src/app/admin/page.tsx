import type { Metadata } from "next";
import AdminDashboard, { type AdminRow } from "@/components/AdminDashboard";
import SetupNotice from "@/components/SetupNotice";
import { isAdmin } from "@/lib/admin-auth";
import { getDraw, targetOf } from "@/lib/draw";
import { getAdminPassword, getAdminWarnings, getCriticalIssues } from "@/lib/env";
import { formatBogota } from "@/lib/format";
import { participants } from "@/lib/participants";
import { getAllReveals } from "@/lib/reveals";
import { getBaseUrl } from "@/lib/site";
import { getStore } from "@/lib/store";
import { tokenFor } from "@/lib/tokens";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Panel" };

type Props = { searchParams: Promise<{ e?: string }> };

const ERRORS: Record<string, string> = {
  wrong: "Contraseña incorrecta.",
  locked: "Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.",
  disabled: "El panel está desactivado: falta ADMIN_PASSWORD (mínimo 6 caracteres).",
};

// Solo claves propias: un ?e=constructor no debe devolver una función y romper la página.
function errorMessage(code: string | undefined): string | null {
  if (!code || !Object.hasOwn(ERRORS, code)) return null;
  return ERRORS[code];
}

function LoginView({ error, disabled }: { error?: string; disabled: boolean }) {
  const message = disabled ? ERRORS.disabled : errorMessage(error);
  return (
    <section className="card setup login">
      <p className="card-kicker">Solo para el organizador</p>
      <h1 className="modal-title">Entrar al panel</h1>
      <form action={loginAction} className="login-form">
        <label className="field">
          <span>Contraseña</span>
          <input type="password" name="password" autoComplete="current-password" required disabled={disabled} />
        </label>
        {message && (
          <p className="error" role="alert">
            {message}
          </p>
        )}
        <button type="submit" className="btn btn-primary" disabled={disabled}>
          Entrar
        </button>
      </form>
    </section>
  );
}

export default async function AdminPage({ searchParams }: Props) {
  const issues = getCriticalIssues();
  if (issues.length) return <SetupNotice issues={issues} />;

  if (!(await isAdmin())) {
    const { e } = await searchParams;
    return <LoginView error={e} disabled={!getAdminPassword()} />;
  }

  const draw = getDraw();
  const base = await getBaseUrl();
  const reveals = await getAllReveals(participants.map((p) => p.slug));

  const rows: AdminRow[] = participants.map((p) => {
    const target = targetOf(p.slug);
    const at = reveals.get(p.slug) ?? null;
    return {
      slug: p.slug,
      name: p.name,
      targetSlug: target.slug,
      targetName: target.name,
      link: `${base}/r/${tokenFor(p.slug)}`,
      revealedLabel: at ? formatBogota(at) : null,
    };
  });

  return (
    <AdminDashboard
      rows={rows}
      drawId={draw.id}
      warnings={getAdminWarnings()}
      storeKind={getStore().kind}
      groupLink={base}
    />
  );
}
