"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { KineticNavigation } from "@/components/ui/sterling-gate-kinetic-navigation";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  return (
    <>
      {!isAuthRoute && <KineticNavigation />}
      {children}
    </>
  );
}
