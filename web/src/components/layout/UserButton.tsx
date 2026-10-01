"use client";

import { ChevronsUpDown, Languages, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function UserButton() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const name = user?.name || t("nav.account");
  const vietnamese = locale === "vi";

  function onLogout() {
    logout();
    router.push("/login");
  }

  function toggleLocale() {
    setLocale(vietnamese ? "en" : "vi");
  }

  return (
    <SidebarMenu className="group-data-[collapsible=icon]:items-center">
      <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
        <Popover>
          <PopoverTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-medium">
                {initials(name)}
              </span>
              <span className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-medium">{name}</span>
                {user?.email ? <span className="truncate text-xs text-muted-foreground">{user.email}</span> : null}
              </span>
              <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 p-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              onClick={toggleLocale}
            >
              <Languages className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{t("language.label")}</span>
              <span
                role="switch"
                aria-checked={vietnamese}
                className="inline-flex shrink-0 rounded-full bg-muted p-0.5 text-[10px] font-semibold tracking-wide"
              >
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 transition-colors",
                    vietnamese ? "text-muted-foreground" : "bg-background text-foreground shadow-sm",
                  )}
                >
                  EN
                </span>
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 transition-colors",
                    vietnamese ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  VI
                </span>
              </span>
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              {t("nav.logOut")}
            </button>
          </PopoverContent>
        </Popover>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
