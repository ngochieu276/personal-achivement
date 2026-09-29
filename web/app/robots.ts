import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/register", "/projects", "/dashboard", "/activities", "/groups", "/subjects"],
    },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
