import type { ReactNode } from "react";
import { loginUrl, registerUrl } from "@/lib/urls";
import { cn } from "@/lib/cn";

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
    <a
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
    </a>
  );
}

export function SignInLink({ className }: { className?: string }) {
  return (
    <AppLink href={loginUrl()} variant="ghost" className={className}>
      Sign in
    </AppLink>
  );
}

export function GetStartedLink({ className }: { className?: string }) {
  return (
    <AppLink href={registerUrl()} variant="primary" className={className}>
      Get started
    </AppLink>
  );
}
