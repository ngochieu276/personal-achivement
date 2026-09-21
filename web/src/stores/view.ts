import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ViewMode = "cards" | "list";

type ViewState = {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
};

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      mode: "cards",
      setMode: (mode) => set({ mode }),
    }),
    { name: "pr-view" },
  ),
);
