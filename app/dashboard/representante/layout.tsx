import { requirePageRole } from "@/lib/page-auth";
import { ROLE } from "@/lib/roles";

export default async function RepresentanteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole([ROLE.REPRESENTANTE]);
  return <>{children}</>;
}
