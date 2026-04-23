import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { redirectForRole } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const tipoUser = (session.user as { tipoUser?: string })?.tipoUser;
  redirect(redirectForRole(tipoUser));
}
