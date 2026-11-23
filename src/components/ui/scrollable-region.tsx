import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScrollableRegionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Classes for the outer (non-scrolling) wrapper, e.g. "flex-1". */
  wrapperClassName?: string;
  /** Gradient start color classes that match the surface behind the region. */
  fadeFrom?: string;
  /** Hide the top fade, e.g. when the region has a sticky header. */
  showTopFade?: boolean;
  /** Text of the "more below" pill. */
  hint?: string;
  /** Set false to hide the pill (e.g. when a nested region already shows one). */
  showHint?: boolean;
}

/**
 * A vertically scrolling area that makes it obvious it scrolls:
 *  - always-visible scrollbar (see .admin-dialog-scrollbar in index.css)
 *  - soft fades on whichever edge has more content
 *  - a "Scroll for more" pill that disappears once you reach the end
 */
export function ScrollableRegion({
  children,
  className,
  wrapperClassName,
  fadeFrom = "from-white dark:from-[#111327]",
  showTopFade = true,
  hint = "Scroll for more",
  showHint = true,
  ...rest
}: ScrollableRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const next = {
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    };
    setEdges((prev) =>
      prev.top === next.top && prev.bottom === next.bottom ? prev : next,
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const resize = new ResizeObserver(update);
    resize.observe(el);
    Array.from(el.children).forEach((child) => resize.observe(child));
    // Content often arrives after mount (loading -> loaded), so re-measure.
    const mutations = new MutationObserver(update);
    mutations.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", update);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [update]);

  const scrollDown = () => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollBy({
      top: Math.max(el.clientHeight * 0.8, 120),
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <div className={cn("relative flex min-h-0 flex-col", wrapperClassName)}>
      <div
        ref={ref}
        className={cn(
          "admin-dialog-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain",
          className,
        )}
        {...rest}
      >
        {children}
      </div>
      {showTopFade && (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-6 bg-gradient-to-b to-transparent transition-opacity duration-200",
            fadeFrom,
            edges.top ? "opacity-100" : "opacity-0",
          )}
        />
      )}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-14 bg-gradient-to-t to-transparent transition-opacity duration-200",
          fadeFrom,
          edges.bottom ? "opacity-100" : "opacity-0",
        )}
      />
      {showHint && (
        <button
          type="button"
          onClick={scrollDown}
          tabIndex={edges.bottom ? 0 : -1}
          aria-hidden={!edges.bottom}
          aria-label="Scroll down for more"
          className={cn(
            "absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#3730A3] px-3 py-1.5 text-xs font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#312E81]",
            edges.bottom
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          {hint}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
