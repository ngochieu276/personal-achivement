"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ActivitiesNavButton } from "@/components/layout/ActivitiesNavButton";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/stores/auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <Link href="/projects" className="font-serif text-lg tracking-tight">
            Personal Record
          </Link>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <ActivitiesNavButton />
            <span className="hidden text-muted-foreground sm:inline">{user?.name}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logout();
                router.push("/login");
              }}
            >
              Log out
            </Button>
          </div>
        </header>
        <div data-scroll-root className="min-w-0 flex-1 overflow-x-clip overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
