import { Pressable, Text, View } from "react-native";
import { EntityIcon, FEATURED_ICON_NAMES } from "@/lib/icons";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

export function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  return (
    <View className="gap-2">
      <Text className="text-sm font-medium text-foreground">{t("common.iconOptional")}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Pressable
          className={cn("rounded-lg border px-3 py-2", !value ? "border-primary bg-muted" : "border-border bg-card")}
          onPress={() => onChange("")}
        >
          <Text className="text-xs text-foreground">{t("common.noIcon")}</Text>
        </Pressable>
        {FEATURED_ICON_NAMES.map((name) => (
          <Pressable
            key={name}
            className={cn(
              "h-10 w-10 items-center justify-center rounded-lg border",
              value === name ? "border-primary bg-muted" : "border-border bg-card",
            )}
            onPress={() => onChange(name)}
          >
            <EntityIcon name={name} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
