import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { AddProgressForm } from "@/components/subjects/ProgressControls";
import { SubjectStatusBadge } from "@/components/subjects/SubjectStatus";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/i18n";
import { remainingLabel, unitLabel } from "@/lib/format";
import { EntityIcon } from "@/lib/icons";
import type { Subject } from "@/lib/types";

export function SubjectCard({ subject, onEdit }: { subject: Subject; onEdit: (subject: Subject) => void }) {
  const { t } = useI18n();
  const unit = unitLabel(subject.kpiType);
  return (
    <Card>
      <Link href={`/subjects/${subject.id}`} asChild>
        <Pressable className="gap-2">
          <View className="flex-row items-center gap-2">
            <EntityIcon name={subject.icon} color="#384959" />
            <Text className="flex-1 font-serif text-lg text-foreground">{subject.name}</Text>
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onEdit(subject);
              }}
            >
              <Text className="text-sm text-secondary">{t("subjects.edit")}</Text>
            </Pressable>
          </View>
          <SubjectStatusBadge status={subject.status} comment={subject.statusComment} />
          <Text className="text-sm text-muted-foreground">
            {subject.currentProgress} / {subject.kpi} {unit}
            {subject.activeWindow ? ` · ${remainingLabel(subject.activeWindow.end)}` : ""}
            {subject.currentStreak ? ` · ${t("time.streak", { count: subject.currentStreak })}` : ""}
          </Text>
          <ProgressBar current={subject.currentProgress} target={subject.kpi} />
        </Pressable>
      </Link>
      <View className="mt-3">
        <AddProgressForm
          subjectId={subject.id}
          projectId={subject.projectId}
          kpiType={subject.kpiType}
          subjectName={subject.name}
          subjectIcon={subject.icon}
        />
      </View>
    </Card>
  );
}
