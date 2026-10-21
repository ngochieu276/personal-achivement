import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";

WebBrowser.maybeCompleteAuthSession();

export function GoogleAuthButton({
  label,
  onAuthenticated,
  onError,
}: {
  label: string;
  onAuthenticated: (token: string, user: User) => void;
  onError: (message: string) => void;
}) {
  const { t } = useI18n();
  const [clientId, setClientId] = useState(process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "");
  const [pending, setPending] = useState(false);
  const redirectUri = AuthSession.makeRedirectUri();

  const [, response, promptAsync] = Google.useAuthRequest({
    clientId: clientId || "missing",
    iosClientId: clientId || undefined,
    androidClientId: clientId || undefined,
    webClientId: clientId || undefined,
    scopes: ["openid", "email", "profile"],
    redirectUri,
  });

  useEffect(() => {
    api<{ clientId: string | null }>("/auth/google/config")
      .then((data) => {
        if (data.clientId) setClientId(data.clientId);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const accessToken = response?.type === "success" ? response.authentication?.accessToken : undefined;
    if (!accessToken) {
      if (response?.type === "error") onError(t("auth.googleFailed"));
      if (response?.type === "cancel" || response?.type === "dismiss") onError(t("auth.googleCancelled"));
      return;
    }
    setPending(true);
    api<{ token: string; user: User }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    })
      .then((data) => onAuthenticated(data.token, data.user))
      .catch((error) => onError(error instanceof Error ? error.message : t("auth.googleFailed")))
      .finally(() => setPending(false));
  }, [onAuthenticated, onError, response, t]);

  return (
    <View className="mb-4 gap-4">
      <Button
        variant="outline"
        loading={pending}
        onPress={() => {
          if (!clientId) {
            onError(t("auth.googleMissing"));
            return;
          }
          onError("");
          void promptAsync();
        }}
      >
        {pending ? t("auth.connecting") : label}
      </Button>
      <View className="flex-row items-center gap-2">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-xs uppercase text-muted-foreground">{t("auth.or")}</Text>
        <View className="h-px flex-1 bg-border" />
      </View>
    </View>
  );
}
