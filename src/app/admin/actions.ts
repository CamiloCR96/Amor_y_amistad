"use server";

import { redirect } from "next/navigation";
import { logoutAdmin, tryLogin } from "@/lib/admin-auth";
import { getCriticalIssues } from "@/lib/env";

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
