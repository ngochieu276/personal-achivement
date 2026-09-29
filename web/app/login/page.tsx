"use client";

import { GuestShell } from "@/components/layout/AuthGate";
import { LoginPage } from "@/views/auth/LoginPage";

export default function LoginRoute() {
  return (
    <GuestShell>
      <LoginPage />
    </GuestShell>
  );
}
