import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function ExternoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.EXTERNO]);
  return <>{children}</>;
}
