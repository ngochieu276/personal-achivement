import { Activity } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ActivitiesNavButton() {
  const pathname = usePathname();
  const active = pathname === "/activities";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className={cn("h-9 w-9", active && "bg-muted")}
          >
            <Link href="/activities" aria-label="Activities" aria-current={active ? "page" : undefined}>
              <Activity className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Activities</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
