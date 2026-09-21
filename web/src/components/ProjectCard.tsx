import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { EditButton } from "@/components/EditButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { ViewMode } from "@/stores/view";

export function ProjectCard({
  project,
  variant,
  onEdit,
}: {
  project: Project;
  variant: ViewMode;
  onEdit: (project: Project) => void;
}) {
  const count = project.subjectCount ?? 0;
  const isList = variant === "list";

  return (
    <Card className={cn("transition-transform hover:-translate-y-0.5", isList && "hover:translate-y-0")}>
      <CardHeader className={isList ? "flex-row items-center gap-4 p-4" : undefined}>
        <div className={cn("flex items-center justify-between", isList && "w-full")}>
          <FolderKanban className="h-5 w-5 shrink-0 text-secondary" />
          {isList ? null : <Badge variant="outline">{count} subjects</Badge>}
        </div>
        <div className={cn(isList && "min-w-0 flex-1")}>
          <Link to={`/projects/${project.id}`}>
            <CardTitle className="hover:underline">{project.name}</CardTitle>
          </Link>
          <CardDescription>
            Started {formatDate(project.createdAt)}
            {isList ? ` · ${count} subjects` : ""}
          </CardDescription>
        </div>
        <EditButton label={`Edit ${project.name}`} onClick={() => onEdit(project)} />
      </CardHeader>
      {isList ? null : <CardContent />}
    </Card>
  );
}
