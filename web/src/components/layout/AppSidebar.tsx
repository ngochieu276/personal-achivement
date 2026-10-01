"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderKanban, LayoutDashboard, Plus } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@/components/layout/UserButton";
import { FormDialog } from "@/components/shared/FormDialog";
import { GroupForm } from "@/components/projects/GroupForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { EntityIcon } from "@/lib/icons";
import { api } from "@/lib/api";
import type { GroupTree } from "@/lib/types";
import { useI18n } from "@/i18n";

export function AppSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
    staleTime: 60_000,
  });

  const createGroup = useMutation({
    mutationFn: () =>
      api("/groups", {
        method: "POST",
        body: JSON.stringify({ id: groupId, name: groupName, icon: groupIcon }),
      }),
    onSuccess: async () => {
      setGroupId("");
      setGroupName("");
      setGroupIcon("");
      setGroupOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
    },
  });

  const groups = navQuery.data?.groups ?? [];
  const ungrouped = navQuery.data?.ungrouped ?? [];

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="overflow-hidden">
        <SidebarMenu className="group-data-[collapsible=icon]:items-center">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              size="lg"
              tooltip={t("brand.name")}
              className="h-auto py-1.5 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:overflow-hidden group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
            >
              <Link
                href="/projects"
                onClick={closeMobile}
                className="h-auto gap-2.5 group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
              >
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-md bg-streak font-serif text-[15px] italic leading-none text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                >
                  Pr
                </span>
                <span className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <span className="block font-serif text-[1.05rem] italic leading-6 tracking-tight">{t("brand.personal")}</span>
                  <span className="mt-0.5 block text-[10px] font-medium uppercase leading-4 tracking-[0.16em] text-streak">
                    {t("brand.record")}
                  </span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/dashboard"}
              tooltip={t("nav.dashboard")}
              className="group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <Link href="/dashboard" onClick={closeMobile} className="group-data-[collapsible=icon]:justify-center">
                <LayoutDashboard />
                <span className="group-data-[collapsible=icon]:hidden">{t("nav.dashboard")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              asChild
              isActive={pathname === "/projects"}
              tooltip={t("nav.projects")}
              className="group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <Link href="/projects" onClick={closeMobile} className="group-data-[collapsible=icon]:justify-center">
                <FolderKanban />
                <span className="group-data-[collapsible=icon]:hidden">{t("nav.projects")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center justify-between gap-1">
            <SidebarGroupLabel>{t("nav.groups")}</SidebarGroupLabel>
            <FormDialog
              open={groupOpen}
              onOpenChange={setGroupOpen}
              title={t("groups.new")}
              trigger={
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden">
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">{t("nav.createGroup")}</span>
                </Button>
              }
            >
              <GroupForm
                id={groupId}
                name={groupName}
                icon={groupIcon}
                onIdChange={setGroupId}
                onNameChange={setGroupName}
                onIconChange={setGroupIcon}
                onSubmit={() => createGroup.mutate()}
                pending={createGroup.isPending}
                error={createGroup.error?.message}
                submitLabel={t("common.create")}
              />
            </FormDialog>
          </div>
          <SidebarGroupContent>
            {navQuery.isLoading ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            ) : groups.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{t("nav.noGroups")}</p>
            ) : (
              <SidebarMenu>
                {groups.map((group) => (
                  <Collapsible key={group.id} defaultOpen={group.projects.length > 0} className="group/collapsible">
                    <SidebarMenuItem>
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          className="flex-1"
                          isActive={pathname === `/groups/${group.id}`}
                          tooltip={group.name}
                        >
                          <Link href={`/groups/${group.id}`} onClick={closeMobile}>
                            <EntityIcon name={group.icon} className="h-4 w-4" />
                            <span>{group.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        {group.projects.length > 0 ? (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 group-data-[collapsible=icon]:hidden">
                              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                              <span className="sr-only">{t("nav.toggleNamed", { name: group.name })}</span>
                            </Button>
                          </CollapsibleTrigger>
                        ) : null}
                      </div>
                      {group.projects.length > 0 ? (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {group.projects.map((project) => (
                              <SidebarMenuSubItem key={project.id}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={pathname === `/projects/${project.id}`}
                                >
                                  <Link href={`/projects/${project.id}`} onClick={closeMobile}>
                                    <EntityIcon name={project.icon} fallback={FolderKanban} className="h-4 w-4" />
                                    <span>{project.name}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      ) : null}
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>{t("nav.projects")}</SidebarGroupLabel>
          <SidebarGroupContent>
            {ungrouped.length === 0 && groups.length > 0 ? (
              <p className="px-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">{t("nav.allProjectsGrouped")}</p>
            ) : (
              <SidebarMenu>
                {ungrouped.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild isActive={pathname === `/projects/${project.id}`} tooltip={project.name}>
                      <Link href={`/projects/${project.id}`} onClick={closeMobile}>
                        <EntityIcon name={project.icon} fallback={FolderKanban} className="h-4 w-4" />
                        <span>{project.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <UserButton />
      </SidebarFooter>
    </Sidebar>
  );
}
