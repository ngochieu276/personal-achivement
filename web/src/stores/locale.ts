import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppLocale = "en" | "vi";

type LocaleState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: "en",
      setLocale: (locale) => set({ locale }),
    }),
    { name: "pr-locale" },
  ),
);
