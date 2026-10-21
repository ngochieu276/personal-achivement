import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Card";
import { IconPicker } from "@/components/shared/IconPicker";
import { useI18n } from "@/i18n";

export function GroupForm({
  name,
  icon,
  id,
  onNameChange,
  onIconChange,
  onIdChange,
  onSubmit,
  pending,
  error,
  submitLabel,
  showId,
}: {
  name: string;
  icon: string;
  id?: string;
  onNameChange: (value: string) => void;
  onIconChange: (value: string) => void;
  onIdChange?: (value: string) => void;
  onSubmit: () => void;
  pending: boolean;
  error?: string;
  submitLabel: string;
  showId?: boolean;
}) {
  const { t } = useI18n();
  return (
    <View className="gap-4">
      {showId ? (
        <View>
          <Label>{t("groups.id")}</Label>
          <Input value={id} onChangeText={onIdChange} placeholder={t("groups.idPlaceholder")} autoCapitalize="none" />
        </View>
      ) : null}
      <View>
        <Label>{t("common.name")}</Label>
        <Input value={name} onChangeText={onNameChange} />
      </View>
      <IconPicker value={icon} onChange={onIconChange} />
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
      <Button loading={pending} onPress={onSubmit} disabled={!name.trim() || (showId && !id)}>
        {pending ? t("common.saving") : submitLabel}
      </Button>
    </View>
  );
}
