import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

// /dashboard/direccion no esta mapeado a ningun rol del catalogo actual.
// Solo se permite a admin entrar (sysadmin puede ver todo).
export default async function DireccionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.ADMIN]);
  return <>{children}</>;
}
