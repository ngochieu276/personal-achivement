import { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui/Button";
import { AppModal } from "@/components/ui/Modal";
import { useI18n } from "@/i18n";
import { useAuthStore } from "@/stores/auth";

export function AccountMenu() {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onPress={() => setOpen(true)}>
        {user?.name ?? t("nav.account")}
      </Button>
      <AppModal open={open} onClose={() => setOpen(false)} title={t("nav.account")}>
        <View className="gap-3">
          {user ? <Text className="text-sm text-muted-foreground">{user.email}</Text> : null}
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">{t("language.label")}</Text>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setLocale(locale === "en" ? "vi" : "en")}
            >
              {locale === "en" ? t("language.vi") : t("language.en")}
            </Button>
          </View>
          <Button
            variant="destructive"
            onPress={() => {
              logout();
              setOpen(false);
              router.replace("/login");
            }}
          >
            {t("nav.logOut")}
          </Button>
        </View>
      </AppModal>
    </>
  );
}
