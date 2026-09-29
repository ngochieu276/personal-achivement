"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    if (useAuthStore.persist.hasHydrated()) {
      finish();
      return;
    }
    return useAuthStore.persist.onFinishHydration(finish);
  }, []);

  return hydrated;
}

export function ProtectedShell({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;
  return <>{children}</>;
}

export function GuestShell({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const hydrated = useHydrated();

  useEffect(() => {
    if (hydrated && token) router.replace("/projects");
  }, [hydrated, token, router]);

  if (!hydrated || token) return null;
  return <>{children}</>;
}
