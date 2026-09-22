import { FolderKanban } from "lucide-react";
import { CardLink } from "@/components/CardLink";
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
  const edit = <EditButton label={`Edit ${project.name}`} onClick={() => onEdit(project)} />;

  if (variant === "list") {
    return (
      <CardLink to={`/projects/${project.id}`} label={project.name}>
        <Card className="transition-colors hover:bg-muted/40">
          <CardHeader className="flex flex-row items-center gap-4 p-4">
            <EntityIcon name={project.icon} fallback={FolderKanban} className="h-5 w-5 shrink-0 text-secondary" />
            <div className="min-w-0 flex-1">
              <CardTitle>{project.name}</CardTitle>
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
      </CardLink>
    );
  }

  return (
    <CardLink to={`/projects/${project.id}`} label={project.name}>
      <Card className="h-full transition-transform hover:-translate-y-0.5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <EntityIcon name={project.icon} fallback={FolderKanban} className="h-5 w-5 shrink-0 text-secondary" />
            <Badge variant="outline">{count} subjects</Badge>
          </div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <CardTitle>{project.name}</CardTitle>
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
    </CardLink>
  );
}
