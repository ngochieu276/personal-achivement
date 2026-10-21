import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Card";
import { IconPicker } from "@/components/shared/IconPicker";
import { useI18n } from "@/i18n";
import type { Group } from "@/lib/types";

export function ProjectForm({
  name,
  icon,
  onNameChange,
  onIconChange,
  groupIds,
  onGroupIdsChange,
  groups,
  onSubmit,
  pending,
  error,
  submitLabel,
}: {
  name: string;
  icon: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  groupIds: string[];
  onGroupIdsChange: (value: string[]) => void;
  groups: Group[];
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  submitLabel: string;
}) {
  const { t } = useI18n();
  return (
    <View className="gap-4">
      <View>
        <Label>{t("common.name")}</Label>
        <Input value={name} onChangeText={onNameChange} />
      </View>
      <IconPicker value={icon} onChange={onIconChange} />
      {groups.length > 0 ? (
        <View>
          <Label>{t("projects.groupsOptional")}</Label>
          <View className="flex-row flex-wrap gap-2">
            {groups.map((group) => {
              const selected = groupIds.includes(group.id);
              return (
                <Button
                  key={group.id}
                  size="sm"
                  variant={selected ? "secondary" : "outline"}
                  onPress={() =>
                    onGroupIdsChange(
                      selected ? groupIds.filter((id) => id !== group.id) : [...groupIds, group.id],
                    )
                  }
                >
                  <Text className={selected ? "text-primary-foreground" : "text-foreground"}>{group.name}</Text>
                </Button>
              );
            })}
          </View>
        </View>
      ) : null}
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button loading={pending} onPress={onSubmit} disabled={!name.trim()}>
        {pending ? t("common.saving") : submitLabel}
      </Button>
    </View>
  );
}
