import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import Link from "next/link";

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link href={to} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
