import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function DirectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.DIRECTOR]);
  return <>{children}</>;
}
