import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { ArrowUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A nested region reports here while its "more below" pill is showing, so the
// parent can stay quiet instead of stacking a second pill on top of it.
const NestedCueContext = createContext<((delta: number) => void) | null>(null);

interface ScrollableRegionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Classes for the outer (non-scrolling) wrapper, e.g. "flex-1". */
  wrapperClassName?: string;
  /** Gradient start color classes matching the surface behind the region. */
  fadeFrom?: string;
  /** Hide the top fade, e.g. when the region has a sticky header. */
  showTopFade?: boolean;
  /** Pill text when no item count is available. */
  hint?: string;
  /** Set false to hide the pill entirely. */
  showHint?: boolean;
  /**
   * CSS selector (relative to the scroller, e.g. ":scope > *") for the items in
   * the list. When set, the pill says how many are still below: "30 more reviews".
   */
  itemSelector?: string;
  /** [singular, plural] noun used with itemSelector. */
  itemLabel?: [string, string];
  /** Show a round "back to top" button once the user has scrolled down. */
  backToTop?: boolean;
}

/**
 * A scrolling area for apps that hide scrollbars. Because there is no scrollbar
 * to say "there is more", it tells the user in the content itself:
 *  - a soft fade on every edge that has more content (top, bottom, left, right)
 *  - a pill at the bottom, "N more reviews" or "Scroll for more", that scrolls
 *    down when clicked and disappears at the end
 *  - optionally a "back to top" button once you have scrolled away from the top
 */
export function ScrollableRegion({
  children,
  className,
  wrapperClassName,
  fadeFrom = "from-white dark:from-[#111327]",
  showTopFade = true,
  hint = "Scroll for more",
  showHint = true,
  itemSelector,
  itemLabel,
  backToTop = false,
  ...rest
}: ScrollableRegionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const reportToParent = useContext(NestedCueContext);
  const [nestedCues, setNestedCues] = useState(0);
  const [edges, setEdges] = useState({
    top: false,
    bottom: false,
    left: false,
    right: false,
    below: 0,
  });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    let below = 0;
    if (itemSelector) {
      const bottom = el.getBoundingClientRect().bottom;
      el.querySelectorAll(itemSelector).forEach((item) => {
        // Items with only a sliver showing still count as "below".
        if (item.getBoundingClientRect().top >= bottom - 24) below += 1;
      });
    }
    const next = {
      top: el.scrollTop > 4,
      bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 4,
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      below,
    };
    setEdges((prev) =>
      prev.top === next.top &&
      prev.bottom === next.bottom &&
      prev.left === next.left &&
      prev.right === next.right &&
      prev.below === next.below
        ? prev
        : next,
    );
  }, [itemSelector]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const schedule = () => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(measure);
    };
    measure();
    el.addEventListener("scroll", schedule, { passive: true });
    const resize = new ResizeObserver(schedule);
    resize.observe(el);
    Array.from(el.children).forEach((child) => resize.observe(child));
    // Content often arrives after mount (loading -> loaded), so re-measure.
    const mutations = new MutationObserver(schedule);
    mutations.observe(el, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame.current);
      el.removeEventListener("scroll", schedule);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [measure]);

  const pillVisible = showHint && edges.bottom && nestedCues === 0;

  // Tell the parent region (if any) that a pill is showing down here.
  useEffect(() => {
    if (!reportToParent || !showHint || !edges.bottom) return;
    reportToParent(1);
    return () => reportToParent(-1);
  }, [reportToParent, showHint, edges.bottom]);

  const reduceMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scrollDown = () => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      top: Math.max(el.clientHeight * 0.8, 120),
      behavior: reduceMotion() ? "auto" : "smooth",
    });
  };

  const scrollToTop = () => {
    ref.current?.scrollTo({
      top: 0,
      behavior: reduceMotion() ? "auto" : "smooth",
    });
  };

  const pillText =
    itemLabel && edges.below > 0
      ? `${edges.below} more ${edges.below === 1 ? itemLabel[0] : itemLabel[1]}`
      : hint;

  const sideFade = (side: "left" | "right", show: boolean) => (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 z-10 w-8 to-transparent transition-opacity duration-200",
        side === "left"
          ? "left-0 bg-gradient-to-r"
          : "right-0 bg-gradient-to-l",
        fadeFrom,
        show ? "opacity-100" : "opacity-0",
      )}
    />
  );

  return (
    <div className={cn("relative flex min-h-0 flex-col", wrapperClassName)}>
      <NestedCueContext.Provider
        value={(delta) => setNestedCues((n) => Math.max(0, n + delta))}
      >
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
      </NestedCueContext.Provider>
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
          "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t to-transparent transition-opacity duration-200",
          fadeFrom,
          edges.bottom ? "opacity-100" : "opacity-0",
        )}
      />
      {sideFade("left", edges.left)}
      {sideFade("right", edges.right)}
      {showHint && (
        <button
          type="button"
          onClick={scrollDown}
          tabIndex={pillVisible ? 0 : -1}
          aria-hidden={!pillVisible}
          aria-label={`Scroll down: ${pillText}`}
          className={cn(
            "absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#3730A3] px-3.5 py-2 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 transition-all duration-200 hover:bg-[#312E81]",
            pillVisible
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          {pillText}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      )}
      {backToTop && (
        <button
          type="button"
          onClick={scrollToTop}
          tabIndex={edges.top ? 0 : -1}
          aria-hidden={!edges.top}
          aria-label="Back to top"
          className={cn(
            "absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white text-ink-primary shadow-lg transition-all duration-200 hover:bg-[#EEF2FF] dark:border-white/10 dark:bg-[#111327] dark:hover:bg-[#1B1E3A]",
            edges.top
              ? "translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <ArrowUp size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
