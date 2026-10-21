import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardTitle, Label } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Screen } from "@/components/layout/Screen";
import { useI18n } from "@/i18n";
import { api, API_URL } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [health, setHealth] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => (res.ok ? setHealth("ok") : setHealth("down")))
      .catch(() => setHealth("down"));
  }, []);

  async function onSubmit() {
    setPending(true);
    setError("");
    try {
      const data = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.user);
      router.replace("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center py-8">
        <Card>
          <Text className="text-xs uppercase tracking-widest text-muted-foreground">{t("auth.ledger")}</Text>
          <CardTitle>{t("auth.signIn")}</CardTitle>
          <CardDescription>{t("auth.signInDesc")}</CardDescription>
          {health === "down" ? (
            <Text className="mt-2 text-sm text-destructive">API {API_URL} unreachable</Text>
          ) : null}
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
                <Label>{t("common.email")}</Label>
                <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
              </View>
              <View>
                <Label>{t("common.password")}</Label>
                <Input value={password} onChangeText={setPassword} secureTextEntry />
              </View>
              {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
              <Button loading={pending} onPress={() => void onSubmit()}>
                {pending ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </View>
            <Link href="/register" asChild>
              <Text className="mt-4 text-sm text-secondary">
                {t("auth.newHere")} {t("auth.createAccount")}
              </Text>
            </Link>
          </View>
        </Card>
      </View>
    </Screen>
  );
}
