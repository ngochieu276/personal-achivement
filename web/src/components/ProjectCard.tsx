import { FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { EditButton } from "@/components/EditButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { EntityIcon } from "@/lib/icons";
import type { Project } from "@/lib/types";
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
  const title = (
    <Link to={`/projects/${project.id}`}>
      <CardTitle className="hover:underline">{project.name}</CardTitle>
    </Link>
  );
  const edit = <EditButton label={`Edit ${project.name}`} onClick={() => onEdit(project)} />;

  if (variant === "list") {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 p-4">
          <EntityIcon name={project.icon} fallback={FolderKanban} className="h-5 w-5 shrink-0 text-secondary" />
          <div className="min-w-0 flex-1">
            {title}
            <CardDescription>
              Started {formatDate(project.createdAt)} · {count} subjects
              {project.groups && project.groups.length > 0
                ? ` · ${project.groups.map((group) => group.name).join(", ")}`
                : ""}
            </CardDescription>
          </div>
          {edit}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="transition-transform hover:-translate-y-0.5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <EntityIcon name={project.icon} fallback={FolderKanban} className="h-5 w-5 shrink-0 text-secondary" />
          <Badge variant="outline">{count} subjects</Badge>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title}
            <CardDescription>
              Started {formatDate(project.createdAt)}
              {project.groups && project.groups.length > 0
                ? ` · ${project.groups.map((group) => group.name).join(", ")}`
                : ""}
            </CardDescription>
          </div>
          {edit}
        </div>
      </CardHeader>
    </Card>
  );
}
