export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_SUBJECT = 20;

const IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type CloudinaryAccount = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function isAllowedImage(name: string, type: string) {
  if (IMAGE_MIME.has(type)) return true;
  return /\.(jpe?g|png|gif|webp)$/i.test(name);
}

function envValue() {
  const raw = (Deno.env.get("CLOUDINARY_URL") ?? Deno.env.get("CLOUDINARY_SECRET") ?? "").trim();
  return raw.replace(/^CLOUDINARY_URL=/, "").trim();
}

export function cloudinaryAccount(): CloudinaryAccount | null {
  const match = envValue().match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/]+)/);
  if (!match) return null;
  return {
    apiKey: decodeURIComponent(match[1]),
    apiSecret: decodeURIComponent(match[2]),
    cloudName: match[3],
  };
}

async function sha1Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(params: Record<string, string>, apiSecret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return await sha1Hex(`${payload}${apiSecret}`);
}

async function cloudinaryForm(params: Record<string, string>, account: CloudinaryAccount) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signed = { ...params, timestamp };
  const form = new FormData();
  form.set("api_key", account.apiKey);
  form.set("timestamp", timestamp);
  form.set("signature", await sign(signed, account.apiSecret));
  for (const [key, value] of Object.entries(params)) form.set(key, value);
  return form;
}

export async function uploadToCloudinary(
  file: globalThis.File,
  folder: string,
): Promise<{ url: string; publicId: string }> {
  const account = cloudinaryAccount();
  if (!account) throw new Error("Cloudinary is not configured");

  const form = await cloudinaryForm({ folder }, account);
  form.set("file", new Blob([await file.arrayBuffer()], { type: file.type || "application/octet-stream" }), file.name);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${account.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const body = await response.json() as { secure_url?: string; public_id?: string; error?: { message?: string } };
  if (!response.ok || !body.secure_url || !body.public_id) {
    throw new Error(body.error?.message ?? "Cloudinary upload failed");
  }
  return { url: body.secure_url, publicId: body.public_id };
}

export function publicIdFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(?:image|video|raw)\/upload\/(?:v\d+\/)?(.+)\.[^/.]+$/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

export async function destroyCloudinaryUrl(url: string) {
  const account = cloudinaryAccount();
  const publicId = publicIdFromUrl(url);
  if (!account || !publicId) return;

  const form = await cloudinaryForm({ public_id: publicId }, account);
  await fetch(`https://api.cloudinary.com/v1_1/${account.cloudName}/image/destroy`, {
    method: "POST",
    body: form,
  }).catch(() => undefined);
}
