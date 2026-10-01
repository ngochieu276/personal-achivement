"use client";

import type { ReactNode } from "react";
import { ActivitiesNavButton } from "@/components/layout/ActivitiesNavButton";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { CreateProjectButton } from "@/components/projects/CreateProjectButton";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-4" />
          <AppBreadcrumb />
          <div className="ml-auto flex items-center gap-2">
            <ActivitiesNavButton />
            <CreateProjectButton />
          </div>
        </header>
        <div data-scroll-root className="min-w-0 flex-1 overflow-x-clip overflow-y-auto p-4 md:p-6">
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
