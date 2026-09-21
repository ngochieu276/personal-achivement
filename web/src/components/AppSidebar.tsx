import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, FolderKanban, FolderPlus, Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FormDialog } from "@/components/FormDialog";
import { GroupForm } from "@/components/GroupForm";
import { ProjectForm } from "@/components/ProjectForm";
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
import { useAuthStore } from "@/stores/auth";

export function AppSidebar() {
  const location = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [groupOpen, setGroupOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupIcon, setGroupIcon] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectIcon, setProjectIcon] = useState("");
  const [projectGroupIds, setProjectGroupIds] = useState<string[]>([]);

  const navQuery = useQuery({
    queryKey: ["nav"],
    queryFn: () => api<GroupTree>("/groups"),
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

  const createProject = useMutation({
    mutationFn: () =>
      api("/projects", {
        method: "POST",
        body: JSON.stringify({ name: projectName, icon: projectIcon, groupIds: projectGroupIds }),
      }),
    onSuccess: async () => {
      setProjectName("");
      setProjectIcon("");
      setProjectGroupIds([]);
      setProjectOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["nav"] });
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const groups = navQuery.data?.groups ?? [];
  const ungrouped = navQuery.data?.ungrouped ?? [];

  function closeMobile() {
    if (isMobile) setOpenMobile(false);
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" isActive={location.pathname === "/"}>
              <Link to="/" onClick={closeMobile}>
                <FolderKanban />
                <span className="font-serif text-base">Personal Record</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="grid gap-2 px-2">
          <FormDialog
            open={groupOpen}
            onOpenChange={setGroupOpen}
            title="New group"
            trigger={
              <Button variant="outline" size="sm" className="w-full justify-start">
                <FolderPlus className="h-4 w-4" />
                Create group
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
              submitLabel="Create"
            />
          </FormDialog>
          <FormDialog
            open={projectOpen}
            onOpenChange={setProjectOpen}
            title="New project"
            trigger={
              <Button size="sm" className="w-full justify-start">
                <Plus className="h-4 w-4" />
                Create project
              </Button>
            }
          >
            <ProjectForm
              name={projectName}
              icon={projectIcon}
              onNameChange={setProjectName}
              onIconChange={setProjectIcon}
              groupIds={projectGroupIds}
              onGroupIdsChange={setProjectGroupIds}
              groups={groups}
              onSubmit={() => createProject.mutate()}
              pending={createProject.isPending}
              error={createProject.error?.message}
              submitLabel="Create"
            />
          </FormDialog>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Groups</SidebarGroupLabel>
          <SidebarGroupContent>
            {navQuery.isLoading ? (
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              </SidebarMenu>
            ) : groups.length === 0 ? (
              <p className="px-2 text-xs text-muted-foreground">No groups yet.</p>
            ) : (
              <SidebarMenu>
                {groups.map((group) => (
                  <Collapsible key={group.id} defaultOpen={group.projects.length > 0} className="group/collapsible">
                    <SidebarMenuItem>
                      <div className="flex items-center">
                        <SidebarMenuButton
                          asChild
                          className="flex-1"
                          isActive={location.pathname === `/groups/${group.id}`}
                        >
                          <Link to={`/groups/${group.id}`} onClick={closeMobile}>
                            <EntityIcon name={group.icon} className="h-4 w-4" />
                            <span>{group.name}</span>
                          </Link>
                        </SidebarMenuButton>
                        {group.projects.length > 0 ? (
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                              <span className="sr-only">Toggle {group.name}</span>
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
                                  isActive={location.pathname === `/projects/${project.id}`}
                                >
                                  <Link to={`/projects/${project.id}`} onClick={closeMobile}>
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
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            {ungrouped.length === 0 && groups.length > 0 ? (
              <p className="px-2 text-xs text-muted-foreground">All projects are in a group.</p>
            ) : (
              <SidebarMenu>
                {ungrouped.map((project) => (
                  <SidebarMenuItem key={project.id}>
                    <SidebarMenuButton asChild isActive={location.pathname === `/projects/${project.id}`}>
                      <Link to={`/projects/${project.id}`} onClick={closeMobile}>
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
      <SidebarFooter>
        <p className="truncate px-2 text-xs text-muted-foreground">{user?.name}</p>
      </SidebarFooter>
    </Sidebar>
  );
}
