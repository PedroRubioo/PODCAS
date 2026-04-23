import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { redirectForRole } from "@/lib/roles";

/**
 * Para usar dentro de un layout o page (server component).
 * Si no hay sesión → /login.
 * Si la sesión no tiene un rol permitido → al dashboard que sí le toca.
 */
export async function requirePageRole(allowed: string[]) {
  const session = await auth();
  const tipoUser = (session?.user as { tipoUser?: string } | undefined)?.tipoUser;

  if (!session?.user) {
    redirect("/login");
  }
  if (!tipoUser || !allowed.includes(tipoUser)) {
    redirect(redirectForRole(tipoUser));
  }
  return session;
}
