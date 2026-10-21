import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { AppModal } from "@/components/ui/Modal";
import { EntityIcon } from "@/lib/icons";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { compareSubjects } from "@/lib/subjects";
import type { Subject } from "@/lib/types";

export function OrganizeSubjects({
  open,
  onClose,
  projectId,
  subjects,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  subjects: Subject[];
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<Subject[]>([]);

  useEffect(() => {
    if (open) setOrder([...subjects].sort(compareSubjects));
  }, [open, subjects]);

  const save = useMutation({
    mutationFn: () =>
      api(`/projects/${projectId}/subjects/order`, {
        method: "PATCH",
        body: JSON.stringify({ subjectIds: order.map((subject) => subject.id) }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects", projectId] });
      onClose();
    },
  });

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  return (
    <AppModal open={open} onClose={onClose} title={t("subjects.organizeTitle")}>
      <Text className="mb-3 text-sm text-muted-foreground">{t("subjects.organizeDesc")}</Text>
      {order.map((subject, index) => (
        <View key={subject.id} className="mb-2 flex-row items-center gap-2 rounded-lg border border-border p-2">
          <EntityIcon name={subject.icon} />
          <Text className="flex-1 text-sm text-foreground">{subject.name}</Text>
          <Button variant="outline" size="sm" onPress={() => move(index, -1)}>
            ↑
          </Button>
          <Button variant="outline" size="sm" onPress={() => move(index, 1)}>
            ↓
          </Button>
        </View>
      ))}
      {save.error ? <Text className="text-sm text-destructive">{save.error.message}</Text> : null}
      <Button className="mt-3" loading={save.isPending} onPress={() => save.mutate()}>
        {t("common.save")}
      </Button>
    </AppModal>
  );
}
