"use client";

import type { ReactNode } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedShell } from "@/components/layout/AuthGate";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ProtectedShell>
      <AppLayout>{children}</AppLayout>
    </ProtectedShell>
  );
}
