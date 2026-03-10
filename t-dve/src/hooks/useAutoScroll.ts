// src/hooks/useAutoScroll.ts
import { useEffect, useRef, useState } from "react";

export interface UseAutoScrollOptions {
  enabled: boolean;
  speedPxPerSecond?: number;
  resumeDelay?: number;
  deps?: any[]; // dependencies to reset scroll (e.g. [items])
  debug?: boolean; // optional debug logs
}

/**
 * useAutoScroll - smooth auto-scroll for horizontal lists.
 * - Uses requestAnimationFrame.
 * - Waits until scrollWidth > clientWidth (handles lazy images).
 * - Observes size changes via ResizeObserver and retries start.
 * - Pauses/resumes on user interaction.
 */
export default function useAutoScroll<T extends HTMLElement = HTMLDivElement>({
  enabled,
  speedPxPerSecond = 60,
  resumeDelay = 1200,
  deps = [],
  debug = false,
}: UseAutoScrollOptions) {
  const scrollerRef = useRef<T | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<number | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const log = (...args: any[]) => {

  };

  const canScroll = () => {
    const el = scrollerRef.current;
    if (!el) return false;
    return el.scrollWidth > el.clientWidth + 2; // small tolerance
  };

  // animation loop
  const step = (time: number) => {
    if (!rafRef.current && !enabled) return;
    if (pausedRef.current) {
      lastTimeRef.current = time;
      rafRef.current = requestAnimationFrame(step);
      return;
    }
    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    const el = scrollerRef.current;
    if (el) {
      const deltaPx = (speedPxPerSecond * delta) / 1000;
      el.scrollLeft += deltaPx;

      const maxScroll = el.scrollWidth - el.clientWidth;
      if (el.scrollLeft >= maxScroll) {
        // jump back to start (keeps DOM simple)
        el.scrollLeft = 0;
      }
    }

    rafRef.current = requestAnimationFrame(step);
  };

  const startAutoScroll = () => {
    if (!enabled) {
      log("start requested but not enabled");
      return;
    }
    if (rafRef.current) {
      log("already running");
      return;
    }
    // don't start unless there is actual overflow
    if (!canScroll()) {
      log("not starting yet — content not wider than container");
      // fallback: let ResizeObserver trigger start when layout changes
      setIsAutoScrolling(false);
      return;
    }

    lastTimeRef.current = null;
    pausedRef.current = false;
    setIsAutoScrolling(true);
    log("starting auto scroll");
    rafRef.current = requestAnimationFrame(step);
  };

  const stopAutoScroll = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsAutoScrolling(false);
    log("stopped auto scroll");
  };

  // Pause / resume helpers
  const pauseForInteraction = () => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    log("paused for interaction");
  };

  const resumeAfterDelay = () => {
    if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      pausedRef.current = false;
      log("resumed after delay");
    }, resumeDelay) as unknown as number;
  };

  // Watch enabled changes and try start
  useEffect(() => {
    if (enabled) {
      // If content not ready yet, ResizeObserver will start later
      startAutoScroll();
    } else {
      stopAutoScroll();
    }

    return () => {
      stopAutoScroll();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Observe resizing / content changes so we can start when images load etc.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    // Create ResizeObserver if supported
    if (typeof ResizeObserver !== "undefined") {
      resizeObserverRef.current = new ResizeObserver(() => {
        log("resize observed", { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
        // auto-start if enabled and content now overflows
        if (enabled && canScroll() && !rafRef.current) {
          startAutoScroll();
        }
      });
      resizeObserverRef.current.observe(el);
    } else {
      // fallback: add image load listeners so we start when images finish loading
      const imgs = Array.from(el.querySelectorAll("img"));
      const onLoad = () => {
        if (enabled && canScroll() && !rafRef.current) startAutoScroll();
      };
      imgs.forEach((i) => i.addEventListener("load", onLoad));
      return () => imgs.forEach((i) => i.removeEventListener("load", onLoad));
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  // Reset scroll when deps change (like items list)
  useEffect(() => {
    if (scrollerRef.current) scrollerRef.current.scrollLeft = 0;
    // try starting again (in case new items cause overflow)
    if (enabled) {
      // small timeout to allow layout
      setTimeout(() => {
        if (enabled && canScroll() && !rafRef.current) startAutoScroll();
      }, 60);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, []);
  
  return {
    scrollerRef,
    isAutoScrolling,
    pauseForInteraction,
    resumeAfterDelay,
  };
}
