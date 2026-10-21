import { Link } from "expo-router";
import { Text } from "react-native";
import { Screen } from "@/components/layout/Screen";
import { useI18n } from "@/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <Screen>
      <Text className="font-serif text-2xl text-foreground">{t("notFound.title")}</Text>
      <Text className="mt-2 text-sm text-muted-foreground">{t("notFound.body")}</Text>
      <Link href="/projects" className="mt-4 text-secondary">
        {t("notFound.home")}
      </Link>
    </Screen>
  );
}
