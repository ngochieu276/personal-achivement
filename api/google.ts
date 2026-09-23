import * as jose from "jose";

const googleJwks = jose.createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export function googleClientId() {
  return Deno.env.get("GOOGLE_CLIENT_ID")?.trim() || null;
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  name: string;
};

export async function verifyGoogleAccessToken(accessToken: string): Promise<GoogleProfile> {
  if (!googleClientId()) {
    throw new Error("Google sign-in is not configured");
  }

  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Google sign-in failed");
  }

  const payload = await response.json() as {
    sub?: string;
    email?: string;
    email_verified?: boolean | string;
    name?: string;
  };

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const googleId = typeof payload.sub === "string" ? payload.sub : "";
  if (!email || !googleId) {
    throw new Error("Google account is missing email");
  }
  if (payload.email_verified !== true && payload.email_verified !== "true") {
    throw new Error("Google email is not verified");
  }

  const name = typeof payload.name === "string" && payload.name.trim()
    ? payload.name.trim()
    : email.split("@")[0];

  return { googleId, email, name };
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleProfile> {
  const clientId = googleClientId();
  if (!clientId) {
    throw new Error("Google sign-in is not configured");
  }

  const { payload } = await jose.jwtVerify(credential, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: clientId,
  });

  const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
  const googleId = typeof payload.sub === "string" ? payload.sub : "";
  if (!email || !googleId) {
    throw new Error("Google account is missing email");
  }
  if (payload.email_verified !== true) {
    throw new Error("Google email is not verified");
  }

  const name = typeof payload.name === "string" && payload.name.trim()
    ? payload.name.trim()
    : email.split("@")[0];

  return { googleId, email, name };
}
