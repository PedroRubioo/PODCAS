import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  // Root layout (app/layout.tsx) ya provee el <AuthSessionProvider>.
  return <>{children}</>;
}
