import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useLocaleStore } from "@/stores/locale";
import { useViewStore } from "@/stores/view";

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    void Promise.all([
      useAuthStore.persist.rehydrate(),
      useLocaleStore.persist.rehydrate(),
      useViewStore.persist.rehydrate(),
    ]).then(() => setHydrated(true));
  }, []);

  return hydrated;
}
