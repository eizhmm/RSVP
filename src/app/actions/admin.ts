"use server";

import { clearAdminSession, setAdminSession, verifyAdminPassword } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function adminLoginAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const ok = await verifyAdminPassword(password);
  if (!ok) {
    redirect("/admin/login?error=1");
  }
  await setAdminSession();
  redirect("/admin");
}

export async function adminLogoutAction() {
  await clearAdminSession();
  redirect("/admin/login");
}
