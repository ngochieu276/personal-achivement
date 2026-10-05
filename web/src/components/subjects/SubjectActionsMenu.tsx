"use client";

import { CalendarRange, History, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function SubjectActionsMenu({
  subjectId,
  onEvents,
  onEdit,
  onDelete,
}: {
  subjectId: string;
  onEvents: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function choose(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" className="h-9 w-9" aria-label={t("common.moreActions")}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <MenuItem icon={<History className="h-4 w-4" />} onClick={() => choose(onEvents)}>
          {t("subjects.eventsButton")}
        </MenuItem>
        <MenuItem
          icon={<CalendarRange className="h-4 w-4" />}
          onClick={() => choose(() => router.push(`/subjects/${subjectId}/timeline`))}
        >
          {t("subjects.timeline")}
        </MenuItem>
        <MenuItem icon={<Pencil className="h-4 w-4" />} onClick={() => choose(onEdit)}>
          {t("subjects.edit")}
        </MenuItem>
        <div className="my-1 h-px bg-border" />
        <MenuItem
          icon={<Trash2 className="h-4 w-4" />}
          className="text-destructive"
          onClick={() => choose(onDelete)}
        >
          {t("subjects.delete")}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
  className,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
        className,
      )}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
