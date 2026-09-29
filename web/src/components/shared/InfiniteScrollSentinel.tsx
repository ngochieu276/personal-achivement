import { useEffect, useRef } from "react";

export function InfiniteScrollSentinel({
  enabled,
  onVisible,
}: {
  enabled: boolean;
  onVisible: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;
    const root = node.closest("[data-scroll-root]");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onVisible();
      },
      { root: root instanceof Element ? root : null, rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onVisible]);

  return <div ref={ref} className="h-8" aria-hidden="true" />;
}
