"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleAuthButton } from "@/components/shared/GoogleAuthButton";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });
      setAuth(data.token, data.user);
      router.push("/projects");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registerFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{t("auth.startLog")}</p>
          <CardTitle>{t("auth.createAccountTitle")}</CardTitle>
          <CardDescription>{t("auth.registerDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleAuthButton
            label={t("auth.google")}
            onAuthenticated={(token, user) => {
              setAuth(token, user);
              router.push("/projects");
            }}
            onError={setError}
          />
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("common.password")}</Label>
              <Input
                id="password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              {pending ? t("auth.creating") : t("auth.createAccount")}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            {t("auth.haveAccount")}{" "}
            <Link className="text-primary underline-offset-4 hover:underline" href="/login">
              {t("auth.signIn")}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
