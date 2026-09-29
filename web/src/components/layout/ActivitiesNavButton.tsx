import { Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function ActivitiesNavButton() {
  const location = useLocation();
  const active = location.pathname === "/activities";

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
            <Link to="/activities" aria-label="Activities" aria-current={active ? "page" : undefined}>
              <Activity className="h-4 w-4" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Activities</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
