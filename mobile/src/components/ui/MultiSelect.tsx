import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/i18n";

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter((option) => option.label.toLowerCase().includes(needle));
  }, [options, query]);

  return (
    <View className="gap-2">
      <Input
        value={query}
        onChangeText={setQuery}
        placeholder={searchPlaceholder ?? placeholder ?? t("common.search")}
      />
      <View className="flex-row flex-wrap gap-2">
        {filtered.length === 0 ? (
          <Text className="text-sm text-muted-foreground">{t("common.noMatches")}</Text>
        ) : (
          filtered.map((option) => {
            const selected = value.includes(option.value);
            return (
              <Button
                key={option.value}
                size="sm"
                variant={selected ? "secondary" : "outline"}
                onPress={() =>
                  onChange(
                    selected ? value.filter((id) => id !== option.value) : [...value, option.value],
                  )
                }
              >
                <Text className={selected ? "text-sm text-primary-foreground" : "text-sm text-foreground"}>
                  {option.label}
                </Text>
              </Button>
            );
          })
        )}
      </View>
    </View>
  );
}
