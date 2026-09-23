import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { GoogleMark, loadGoogleOauth } from "@/lib/google";
import type { User } from "@/lib/types";

export function GoogleAuthButton({
  label,
  onAuthenticated,
  onError,
}: {
  label: string;
  onAuthenticated: (token: string, user: User) => void;
  onError: (message: string) => void;
}) {
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onErrorRef = useRef(onError);
  const [clientId, setClientId] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || null,
  );
  const [pending, setPending] = useState(false);

  onAuthenticatedRef.current = onAuthenticated;
  onErrorRef.current = onError;

  useEffect(() => {
    let active = true;
    api<{ clientId: string | null }>("/auth/google/config")
      .then((data) => {
        if (active && data.clientId) setClientId(data.clientId);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function signIn() {
    const id = clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!id) {
      onErrorRef.current("Add GOOGLE_CLIENT_ID to api/.env and restart the API.");
      return;
    }

    setPending(true);
    onErrorRef.current("");
    try {
      const oauth = await loadGoogleOauth();
      const accessToken = await new Promise<string>((resolve, reject) => {
        const client = oauth.initTokenClient({
          client_id: id,
          scope: "openid email profile",
          callback: (response) => {
            if (response.access_token) resolve(response.access_token);
            else reject(new Error(response.error || "Google sign-in was cancelled"));
          },
        });
        client.requestAccessToken();
      });

      const data = await api<{ token: string; user: User }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ accessToken }),
      });
      onAuthenticatedRef.current(data.token, data.user);
    } catch (error) {
      onErrorRef.current(error instanceof Error ? error.message : "Google sign-in failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mb-4 space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void signIn()}
        disabled={pending}
      >
        {pending ? <Spinner /> : <GoogleMark className="h-5 w-5" />}
        {pending ? "Connecting..." : label}
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">or</span>
        </div>
      </div>
    </div>
  );
}
