"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, logoutAdmin, tryLogin } from "@/lib/admin-auth";
import { getCriticalIssues } from "@/lib/env";
import { findParticipant, participants } from "@/lib/participants";
import { resetReveals } from "@/lib/reveals";

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

// Reinicia el registro de todo el mundo. Solo el organizador.
export async function resetAllAction(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  await resetReveals(participants.map((p) => p.slug));
  revalidatePath("/admin");
  redirect("/admin?ok=todos");
}

// Reinicia el registro de una sola persona, por si alguien abrio su enlace sin querer.
export async function resetOneAction(formData: FormData): Promise<void> {
  if (!(await isAdmin())) redirect("/admin");
  const slug = String(formData.get("slug") ?? "");
  if (!findParticipant(slug)) redirect("/admin");
  await resetReveals([slug]);
  revalidatePath("/admin");
  redirect(`/admin?ok=${encodeURIComponent(slug)}`);
}
