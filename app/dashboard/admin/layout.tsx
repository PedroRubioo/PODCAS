import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.ADMIN]);
  return <>{children}</>;
}
