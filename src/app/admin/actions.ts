"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logoutAdmin, tryLogin } from "@/lib/admin-auth";
import { getCriticalIssues } from "@/lib/env";
import { findParticipant, participants } from "@/lib/participants";
import { resetReveals } from "@/lib/reveals";

export type ResetResult = { ok: boolean; message: string };

export async function loginAction(formData: FormData): Promise<void> {
  if (getCriticalIssues().length) redirect("/admin");
  const password = String(formData.get("password") ?? "");
  const result = await tryLogin(password);
  if (result === "ok") redirect("/admin");
  redirect(`/admin?e=${result}`);
}

export async function logoutAction(): Promise<void> {
  await logoutAdmin();
  redirect("/admin");
}

const SESION_VENCIDA = "Tu sesion del panel vencio. Recarga la pagina y vuelve a entrar.";

// Devuelven el resultado en vez de redirigir: el panel lo muestra sin recargar.
export async function resetAllAction(): Promise<ResetResult> {
  if (!(await isAdmin())) return { ok: false, message: SESION_VENCIDA };
  await resetReveals(participants.map((p) => p.slug));
  revalidatePath("/admin");
  return {
    ok: true,
    message: "Listo: se reinició el registro de todos. Ya pueden volver a elegir su nombre.",
  };
}

export async function resetOneAction(slug: string): Promise<ResetResult> {
  if (!(await isAdmin())) return { ok: false, message: SESION_VENCIDA };
  const person = findParticipant(String(slug ?? ""));
  if (!person) return { ok: false, message: "Esa persona ya no esta en la lista." };
  await resetReveals([person.slug]);
  revalidatePath("/admin");
  return { ok: true, message: `Listo: se reinició el registro de ${person.name}.` };
}
