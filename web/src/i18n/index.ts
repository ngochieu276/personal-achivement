"use client";

import { useCallback } from "react";
import { en } from "@/i18n/en";
import { vi } from "@/i18n/vi";
import { useLocaleStore, type AppLocale } from "@/stores/locale";

const catalogs = { en, vi } as const;

export type MessageKey = LeafPaths<typeof en>;

type LeafPaths<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Prefix}${K}`
    : T[K] extends Record<string, unknown>
      ? LeafPaths<T[K], `${Prefix}${K}.`>
      : never;
}[keyof T & string];

function lookup(locale: AppLocale, key: string): string {
  const parts = key.split(".");
  let current: unknown = catalogs[locale];
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      current = catalogs.en;
      for (const fallback of parts) {
        if (!current || typeof current !== "object" || !(fallback in current)) return key;
        current = (current as Record<string, unknown>)[fallback];
      }
      break;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : key;
}

export function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    vars[name] == null ? `{${name}}` : String(vars[name]),
  );
}

export function translate(locale: AppLocale, key: MessageKey, vars?: Record<string, string | number>) {
  return interpolate(lookup(locale, key), vars);
}

export function t(key: MessageKey, vars?: Record<string, string | number>) {
  return translate(useLocaleStore.getState().locale, key, vars);
}

export function localeTag(locale: AppLocale = useLocaleStore.getState().locale) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function useI18n() {
  const locale = useLocaleStore((state) => state.locale);
  const setLocale = useLocaleStore((state) => state.setLocale);
  const translateFn = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );
  return { t: translateFn, locale, setLocale };
}
