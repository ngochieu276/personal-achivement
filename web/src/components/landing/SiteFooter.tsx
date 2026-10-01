"use client";

import { SignInLink } from "@/components/landing/AppLink";
import { useI18n } from "@/i18n";

export function SiteFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t bg-card/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8">
        <div>
          <p className="font-serif text-lg">{t("brand.name")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("landing.footer")}
          </p>
        </div>
        <SignInLink />
      </div>
    </footer>
  );
}
