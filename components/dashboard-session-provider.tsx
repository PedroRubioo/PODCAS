"use client";

import { SessionProvider } from "next-auth/react";

export function DashboardSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SessionProvider>{children}</SessionProvider>;
}
