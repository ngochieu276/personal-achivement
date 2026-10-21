import { Link } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EntityIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

export function Screen({
  children,
  className,
  scroll = true,
}: {
  children: ReactNode;
  className?: string;
  scroll?: boolean;
}) {
  const inner = <View className={cn("gap-4 p-4 pb-8", className)}>{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["left", "right"]}>
      {scroll ? <ScrollView className="flex-1 bg-background">{inner}</ScrollView> : inner}
    </SafeAreaView>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  icon,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  icon?: string | null;
  actions?: ReactNode;
}) {
  return (
    <View className="gap-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          {eyebrow ? (
            <Text className="text-xs uppercase tracking-widest text-muted-foreground">{eyebrow}</Text>
          ) : null}
          <View className="mt-1 flex-row items-center gap-2">
            {icon ? <EntityIcon name={icon} size={22} color="#384959" /> : null}
            <Text className="flex-1 font-serif text-2xl text-foreground">{title}</Text>
          </View>
          {subtitle}
        </View>
        {actions ? <View className="flex-row flex-wrap justify-end gap-2">{actions}</View> : null}
      </View>
    </View>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href as never} asChild>
      <Pressable>
        <Text className="text-sm text-secondary">← {label}</Text>
      </Pressable>
    </Link>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <View className="rounded-xl border border-dashed border-border bg-card p-6">
      <Text className="font-serif text-lg text-foreground">{title}</Text>
      {description ? <Text className="mt-2 text-sm text-muted-foreground">{description}</Text> : null}
    </View>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-destructive">{children}</Text>;
}

export function Muted({ children }: { children: ReactNode }) {
  return <Text className="text-sm text-muted-foreground">{children}</Text>;
}
