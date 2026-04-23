import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function MiembroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.MIEMBRO]);
  return <>{children}</>;
}
