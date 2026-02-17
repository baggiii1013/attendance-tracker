"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TimeDialProps {
  label: string;
  dotColor?: string;
  times: string[];
  selectedTime: string;
  onTimeChange: (time: string) => void;
}

const ITEM_HEIGHT = 48;

export default function TimeDial({
  label,
  dotColor = "#4D79FF",
  times,
  selectedTime,
  onTimeChange,
}: TimeDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [paddingPx, setPaddingPx] = useState(0);
  const [activeIndex, setActiveIndex] = useState(() => {
    const idx = times.indexOf(selectedTime);
    return idx !== -1 ? idx : 0;
  });

  // Measure container and compute padding needed to center items
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const h = el.clientHeight;
      setPaddingPx(Math.max(0, h / 2 - ITEM_HEIGHT / 2));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const scrollToIndex = useCallback(
    (index: number, instant = false) => {
      const scrollEl = scrollRef.current;
      if (!scrollEl) return;
      const targetScroll = paddingPx + index * ITEM_HEIGHT - (scrollEl.clientHeight / 2 - ITEM_HEIGHT / 2);
      scrollEl.scrollTo({
        top: targetScroll,
        behavior: instant ? ("instant" as ScrollBehavior) : "smooth",
      });
    },
    [paddingPx]
  );

  // Scroll to initially selected time once padding is known
  useEffect(() => {
    if (paddingPx === 0) return;
    const timer = setTimeout(() => scrollToIndex(activeIndex, true), 20);
    return () => clearTimeout(timer);
  }, [paddingPx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle scroll events — snap to nearest item on scroll end
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl || paddingPx === 0) return;

    const handleScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const scrollTop = scrollEl.scrollTop;
        const centerOffset = scrollTop + scrollEl.clientHeight / 2;
        const index = Math.round((centerOffset - paddingPx - ITEM_HEIGHT / 2) / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, times.length - 1));

        scrollToIndex(clampedIndex);

        if (clampedIndex !== activeIndex) {
          setActiveIndex(clampedIndex);
          onTimeChange(times[clampedIndex]);
        }
      }, 120);
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollEl.removeEventListener("scroll", handleScroll);
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, [activeIndex, times, onTimeChange, scrollToIndex, paddingPx]);

  const handleItemClick = (index: number) => {
    setActiveIndex(index);
    onTimeChange(times[index]);
    scrollToIndex(index);
  };

  const getDistanceFromActive = (i: number) => Math.abs(i - activeIndex);

  return (
    <div
      ref={containerRef}
      className="relative h-full bg-[#0a0a0c] rounded-3xl border border-[rgba(255,255,255,0.15)] shadow-plump-inset overflow-hidden select-none"
    >
      {/* Fade overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 z-20 pointer-events-none" />

      {/* Selection indicator — centered vertically */}
      <div className="absolute top-1/2 left-0 right-0 h-12 -translate-y-1/2 border-y border-white/10 bg-white/5 z-10 pointer-events-none flex items-center justify-between px-2">
        <span className="text-[8px] font-mono text-gray-500">{label}</span>
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            backgroundColor: dotColor,
            boxShadow: `0 0 10px ${dotColor}`,
          }}
        />
      </div>

      {/* Scroll Content */}
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto no-scrollbar text-center"
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {/* Top spacer — JS-measured so first item can center */}
        {paddingPx > 0 && <div style={{ height: paddingPx }} />}

        {times.map((time, i) => {
          const isSelected = i === activeIndex;
          const distance = getDistanceFromActive(i);
          let opacity = 0.2;
          if (distance === 0) opacity = 1;
          else if (distance === 1) opacity = 0.6;
          else if (distance === 2) opacity = 0.4;

          return (
            <button
              key={time}
              type="button"
              onClick={() => handleItemClick(i)}
              className={`w-full flex items-center justify-center font-mono transition-all duration-150 cursor-pointer border-none bg-transparent ${
                isSelected
                  ? "text-white font-bold text-2xl tracking-widest scale-110"
                  : "text-gray-600 text-lg hover:text-gray-400"
              }`}
              style={{ opacity, height: ITEM_HEIGHT }}
            >
              {time}
            </button>
          );
        })}

        {/* Bottom spacer */}
        {paddingPx > 0 && <div style={{ height: paddingPx }} />}
      </div>
    </div>
  );
}
