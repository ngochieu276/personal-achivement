"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function AppLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "outline";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors",
        variant === "primary" && "bg-streak text-white hover:bg-streak/90",
        variant === "ghost" && "text-foreground hover:bg-muted",
        variant === "outline" && "border border-border bg-card hover:bg-muted",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SignInLink({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <AppLink href="/login" variant="ghost" className={className}>
      {t("nav.signIn")}
    </AppLink>
  );
}

export function GetStartedLink({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <AppLink href="/register" variant="primary" className={className}>
      {t("nav.getStarted")}
    </AppLink>
  );
}
