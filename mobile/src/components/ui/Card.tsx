import type { ReactNode } from "react";
import { Text, View, type ViewProps } from "react-native";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn("rounded-xl border border-border bg-card p-4", className)} {...props} />;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn("font-serif text-lg font-semibold text-foreground", className)}>{children}</Text>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <Text className={cn("mt-1 text-sm text-muted-foreground", className)}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text className="mb-1 text-sm font-medium text-foreground">{children}</Text>;
}
