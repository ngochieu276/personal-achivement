import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

export function ResourceLink({
  href,
  variant = "compact",
}: {
  href: string;
  variant?: "compact" | "full";
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex items-center",
        variant === "full" ? "gap-2 text-sm text-primary" : "gap-1",
      )}
    >
      <ExternalLink className={variant === "full" ? "h-4 w-4" : "h-3 w-3"} />
      {variant === "full" ? "Open linked resource" : "Link"}
    </a>
  );
}
