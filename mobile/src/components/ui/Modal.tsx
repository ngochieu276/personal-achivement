import type { ReactNode } from "react";
import { Modal as RNModal, Pressable, ScrollView, Text, View } from "react-native";
import { useI18n } from "@/i18n";
import { Button } from "@/components/ui/Button";

export function AppModal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <RNModal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="max-h-[90%] rounded-t-2xl border border-border bg-card p-5" onPress={(event) => event.stopPropagation()}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="flex-1 font-serif text-lg font-semibold text-foreground">{title}</Text>
            <Button variant="ghost" size="sm" onPress={onClose}>
              {t("common.close")}
            </Button>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  pending,
  error,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  pending?: boolean;
  error?: string;
  onConfirm: () => void;
}) {
  const { t } = useI18n();
  return (
    <AppModal open={open} onClose={onClose} title={title}>
      <Text className="mb-4 text-sm text-muted-foreground">{description}</Text>
      {error ? <Text className="mb-3 text-sm text-destructive">{error}</Text> : null}
      <View className="flex-row justify-end gap-2">
        <Button variant="outline" onPress={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="destructive" loading={pending} onPress={onConfirm}>
          {confirmLabel}
        </Button>
      </View>
    </AppModal>
  );
}
