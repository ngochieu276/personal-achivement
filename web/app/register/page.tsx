"use client";

import { GuestShell } from "@/components/layout/AuthGate";
import { RegisterPage } from "@/views/auth/RegisterPage";

export default function RegisterRoute() {
  return (
    <GuestShell>
      <RegisterPage />
    </GuestShell>
  );
}
