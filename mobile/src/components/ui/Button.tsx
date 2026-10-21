import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { cn } from "@/lib/utils";

export function Button({
  children,
  className,
  textClassName,
  variant = "default",
  size = "default",
  disabled,
  loading,
  ...props
}: PressableProps & {
  children: ReactNode;
  className?: string;
  textClassName?: string;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "default" | "sm" | "icon";
  loading?: boolean;
}) {
  return (
    <Pressable
      className={cn(
        "flex-row items-center justify-center gap-2 rounded-lg",
        size === "default" && "h-11 px-4",
        size === "sm" && "h-9 px-3",
        size === "icon" && "h-10 w-10 px-0",
        variant === "default" && "bg-primary",
        variant === "secondary" && "bg-secondary",
        variant === "outline" && "border border-border bg-card",
        variant === "ghost" && "bg-transparent",
        variant === "destructive" && "bg-destructive",
        disabled && "opacity-50",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "outline" || variant === "ghost" ? "#384959" : "#f7fbff"} /> : null}
      {typeof children === "string" ? (
        <Text
          className={cn(
            "text-sm font-medium",
            (variant === "default" || variant === "secondary" || variant === "destructive") && "text-primary-foreground",
            (variant === "outline" || variant === "ghost") && "text-foreground",
            textClassName,
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}
