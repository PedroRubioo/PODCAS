import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function LiderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.LIDER]);
  return <>{children}</>;
}
