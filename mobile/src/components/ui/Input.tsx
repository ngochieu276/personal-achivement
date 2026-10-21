import { TextInput, type TextInputProps } from "react-native";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      className={cn(
        "h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground",
        className,
      )}
      placeholderTextColor="#6a89a7"
      {...props}
    />
  );
}
