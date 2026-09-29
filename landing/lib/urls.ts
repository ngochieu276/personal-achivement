export function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function loginUrl() {
  return `${appUrl()}/login`;
}

export function registerUrl() {
  return `${appUrl()}/register`;
}
