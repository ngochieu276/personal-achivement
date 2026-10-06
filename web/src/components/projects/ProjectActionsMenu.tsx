"use client";

import { FileText, ListOrdered, MoreHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function ProjectActionsMenu({
  onDocuments,
  onOrganize,
}: {
  onDocuments: () => void;
  onOrganize: () => void;
}) {
  const { t } = useI18n();
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
        <MenuItem icon={<FileText className="h-4 w-4" />} onClick={() => choose(onDocuments)}>
          {t("projects.documents")}
        </MenuItem>
        <MenuItem icon={<ListOrdered className="h-4 w-4" />} onClick={() => choose(onOrganize)}>
          {t("subjects.organize")}
        </MenuItem>
      </PopoverContent>
    </Popover>
  );
}

function MenuItem({
  icon,
  children,
  onClick,
}: {
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted")}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
