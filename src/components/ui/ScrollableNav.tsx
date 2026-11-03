"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableNavProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  scrollAmount?: number;
}

export function ScrollableNav({
  children,
  className = "",
  containerClassName = "",
  scrollAmount = 200,
}: ScrollableNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const hasOverflow = el.scrollWidth > el.clientWidth + 2;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;

    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);

    return () => {
      window.removeEventListener("resize", handleResize);
      observer.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const delta = direction === "left" ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: "smooth" });
    setTimeout(checkScroll, 250);
  };

  return (
    <div className={`relative flex items-center group/scroll ${containerClassName}`}>
      {/* Left Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll left"
          className="absolute left-0 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-card/90 dark:bg-slate-900/90 text-foreground border border-border shadow-md backdrop-blur-md hover:bg-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer -translate-x-1 sm:-translate-x-2"
        >
          <ChevronLeft className="w-4 h-4 text-foreground" />
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className={`flex items-center gap-1.5 overflow-x-auto scrollbar-none no-scrollbar py-1 w-full ${className}`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {children}
      </div>

      {/* Right Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll right"
          className="absolute right-0 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-card/90 dark:bg-slate-900/90 text-foreground border border-border shadow-md backdrop-blur-md hover:bg-secondary hover:scale-105 active:scale-95 transition-all cursor-pointer translate-x-1 sm:translate-x-2"
        >
          <ChevronRight className="w-4 h-4 text-foreground" />
        </button>
      )}
    </div>
  );
}
