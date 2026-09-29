"use client";

import { GetStartedLink, SignInLink } from "@/components/landing/AppLink";
import { useHydrated } from "@/components/layout/AuthGate";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import Link from "next/link";
import { useEffect, useState } from "react";

const links = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const hydrated = useHydrated();
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-colors",
        scrolled ? "border-border bg-card/90 backdrop-blur-md" : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <a href="#top" className="font-serif text-lg tracking-tight">
          Personal Record
        </a>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {!hydrated ? (
            <span className="inline-flex h-9 w-28" aria-hidden />
          ) : token ? (
            <Link
              href="/projects"
              className="inline-flex items-center justify-center rounded-md bg-streak px-4 py-2 text-sm font-medium text-white hover:bg-streak/90"
            >
              Open app
            </Link>
          ) : (
            <>
              <SignInLink className="hidden sm:inline-flex" />
              <GetStartedLink />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
