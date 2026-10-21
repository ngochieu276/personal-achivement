import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { EntityIcon } from "@/lib/icons";
import type { Project } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n";

export function ProjectCard({
  project,
  onEdit,
}: {
  project: Project;
  onEdit: (project: Project) => void;
}) {
  const { t } = useI18n();
  return (
    <Card>
      <Link href={`/projects/${project.id}`} asChild>
        <Pressable className="gap-2">
          <View className="flex-row items-center gap-2">
            <EntityIcon name={project.icon} color="#384959" />
            <Text className="flex-1 font-serif text-lg text-foreground">{project.name}</Text>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => onEdit(project)}
            >
              {t("projects.edit")}
            </Button>
          </View>
          <Text className="text-sm text-muted-foreground">
            {project.subjectCount ?? 0} · {Math.round((project.averageProgress ?? 0) * 100)}%
          </Text>
        </Pressable>
      </Link>
    </Card>
  );
}
