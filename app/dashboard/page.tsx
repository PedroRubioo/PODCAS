import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function DashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const tipoUser = (session.user as { tipoUser?: string })?.tipoUser
  const routes: Record<string, string> = {
    "1": "/dashboard/admin",
    "2": "/dashboard/enlace",
    "3": "/dashboard/miembro",
    "4": "/dashboard/lider",
    "5": "/dashboard/director",
    "6": "/dashboard/direccion",
    "7": "/dashboard/externo",
  }

  redirect(routes[tipoUser ?? ""] ?? "/login")
}
