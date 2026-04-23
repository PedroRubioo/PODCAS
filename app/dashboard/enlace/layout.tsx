import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function EnlaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.ENLACE]);
  return <>{children}</>;
}
