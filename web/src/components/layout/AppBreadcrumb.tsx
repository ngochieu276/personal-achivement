"use client";

import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useI18n, type MessageKey } from "@/i18n";
import { api } from "@/lib/api";
import type { GroupTree, SubjectDetail } from "@/lib/types";

type Crumb = { href?: string; label: string };
type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function AppBreadcrumb() {
  const { t } = useI18n();
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const subjectId = parts[0] === "subjects" ? parts[1] : undefined;

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
    staleTime: 60_000,
  });

  const subjectQuery = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => api<SubjectDetail>(`/subjects/${subjectId}`),
    enabled: Boolean(subjectId),
  });

  const groups = navQuery.data?.groups ?? [];
  const projects = [...groups.flatMap((group) => group.projects), ...(navQuery.data?.ungrouped ?? [])];
  const crumbs = crumbsFor(
    parts,
    {
      groups,
      projects,
      subjectName: subjectQuery.data?.subject.name,
      subjectProjectId: subjectQuery.data?.subject.projectId,
    },
    t,
  );

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap overflow-hidden">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {last || !crumb.href ? (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href} className="truncate">
                      {crumb.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function crumbsFor(
  parts: string[],
  names: {
    groups: GroupTree["groups"];
    projects: GroupTree["ungrouped"];
    subjectName?: string;
    subjectProjectId?: string;
  },
  t: Translate,
): Crumb[] {
  const { groups, projects, subjectName, subjectProjectId } = names;

  if (parts[0] === "dashboard") return [{ label: t("nav.dashboard") }];
  if (parts[0] === "activities") return [{ label: t("nav.activities") }];

  if (parts[0] === "groups" && parts[1]) {
    const group = groups.find((item) => item.id === parts[1]);
    return [{ href: "/projects", label: t("nav.projects") }, { label: group?.name ?? t("breadcrumb.group") }];
  }

  if (parts[0] === "projects" && parts[1]) {
    const project = projects.find((item) => item.id === parts[1]);
    return [{ href: "/projects", label: t("nav.projects") }, { label: project?.name ?? t("breadcrumb.project") }];
  }

  if (parts[0] === "subjects" && parts[1]) {
    const project = projects.find((item) => item.id === subjectProjectId);
    const crumbs: Crumb[] = [
      { href: "/projects", label: t("nav.projects") },
      {
        href: subjectProjectId ? `/projects/${subjectProjectId}` : undefined,
        label: project?.name ?? t("breadcrumb.project"),
      },
      { href: parts[2] === "timeline" ? `/subjects/${parts[1]}` : undefined, label: subjectName ?? t("breadcrumb.subject") },
    ];
    if (parts[2] === "timeline") crumbs.push({ label: t("breadcrumb.timeline") });
    return crumbs;
  }

  return [{ label: t("nav.projects") }];
}
