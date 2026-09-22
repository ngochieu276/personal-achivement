import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import type { User } from "@/lib/types";
import { useAuthStore } from "@/stores/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Ledger</p>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Track time and reps against your own KPIs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={pending}>
              {pending ? <Spinner /> : null}
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            New here?{" "}
            <Link className="text-primary underline-offset-4 hover:underline" to="/register">
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
