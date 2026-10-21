import { Text, View } from "react-native";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Select<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  return (
    <View className={cn("flex-row flex-wrap gap-2", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Button
            key={option.value}
            variant={selected ? "secondary" : "outline"}
            size="sm"
            onPress={() => onChange(option.value)}
          >
            <Text className={selected ? "text-sm text-primary-foreground" : "text-sm text-foreground"}>
              {option.label}
            </Text>
          </Button>
        );
      })}
    </View>
  );
}
