import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle, Label } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/layout/Screen";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

export function RegisterPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit() {
    setPending(true);
    setError("");
    try {
      const data = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setAuth(data.token, data.user);
      router.replace("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <Card>
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.startLog")}</Text>
          <CardTitle>{t("auth.createAccountTitle")}</CardTitle>
          <CardDescription>{t("auth.registerDesc")}</CardDescription>
          <View className="mt-4">
            <GoogleAuthButton
              label={t("auth.google")}
              onAuthenticated={(token, user) => {
                setAuth(token, user);
                router.replace("/projects");
              }}
              onError={setError}
            />
            <View className="gap-3">
              <View>
                <Label>{t("common.name")}</Label>
                <Input value={name} onChangeText={setName} />
              </View>
              <View>
                <Label>{t("common.email")}</Label>
                <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View>
                <Label>{t("common.password")}</Label>
                <Input value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
              <Button loading={pending} onPress={() => void onSubmit()}>
                {pending ? t("auth.creating") : t("auth.createAccount")}
              </Button>
            </View>
            <Link href="/login" asChild>
              <Text className="mt-4 text-sm text-secondary">
                {t("auth.haveAccount")} {t("auth.signIn")}
              </Text>
            </Link>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
