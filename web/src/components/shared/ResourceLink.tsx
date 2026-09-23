import { ExternalLink } from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "@/lib/utils";

export function ResourceLink({
  href,
  variant = "compact",
}: {
  href: string;
  variant?: "compact" | "full";
}) {
  function stop(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={stop}
      className={cn(
        "relative z-10 inline-flex items-center",
        variant === "full" ? "gap-2 text-sm text-primary" : "gap-1",
      )}
    >
      <ExternalLink className={variant === "full" ? "h-4 w-4" : "h-3 w-3"} />
      {variant === "full" ? "Open linked resource" : "Link"}
    </a>
  );
}
