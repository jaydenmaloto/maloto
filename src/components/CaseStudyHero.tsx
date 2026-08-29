"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type PanInfo } from "framer-motion";

interface CaseStudyHeroProps {
  title: string;
  role: string;
  year: string;
  images: string[];
  discLayoutId?: string;
}

export function CaseStudyHero({ title, role, year, images, discLayoutId }: CaseStudyHeroProps) {
  const [index, setIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [showMiniBar, setShowMiniBar] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMiniBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clamp = (i: number) => (i + images.length) % images.length;
  const next = () => setIndex((i) => clamp(i + 1));
  const prev = () => setIndex((i) => clamp(i - 1));

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    const threshold = 60;
    if (info.offset.x < -threshold) next();
    else if (info.offset.x > threshold) prev();
  }

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div ref={topRef} className="flex flex-col items-center px-4 pt-10">
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <motion.div
            layoutId={discLayoutId}
            className="aspect-square overflow-hidden rounded-full bg-black shadow-2xl"
          >
            <motion.div
              className="h-full w-full motion-safe:animate-[spin_22s_linear_infinite]"
              style={{ touchAction: "pan-y", animationPlayState: dragging ? "paused" : "running" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.15}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <img
                src={images[index]}
                alt={`${title} artwork ${index + 1} of ${images.length}`}
                className="pointer-events-none h-full w-full select-none object-cover"
                draggable={false}
              />
            </motion.div>
          </motion.div>

          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-0 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-xl shadow-md active:scale-95"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-0 top-1/2 flex h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background/90 text-xl shadow-md active:scale-95"
          >
            ›
          </button>
        </div>

        <div
          className="mt-5 flex w-full max-w-xs gap-3 overflow-x-auto pb-2 sm:max-w-sm"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === index}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 transition-colors ${
                i === index ? "border-foreground" : "border-transparent opacity-60"
              }`}
              style={{ scrollSnapAlign: "start" }}
            >
              <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
            </button>
          ))}
        </div>

        <h1 className="mt-8 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          {title} <span aria-hidden className="align-middle text-lg opacity-70">♪</span>
        </h1>
        <p className="mt-1 text-center text-sm text-foreground/60">
          as the {role} ({year})
        </p>
      </div>

      <div ref={sentinelRef} aria-hidden className="h-px w-full" />

      <div
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-foreground/10 bg-background/95 px-4 backdrop-blur transition-transform duration-300 ${
          showMiniBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <button
          type="button"
          onClick={scrollToTop}
          className="flex w-full items-center gap-3 py-2 text-left active:opacity-70"
          aria-label="Scroll to top of case study"
        >
          <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black motion-safe:animate-[spin_3s_linear_infinite]">
            <img src={images[0]} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium">{title}</span>
            <span className="block text-xs text-foreground/60">{year}</span>
          </span>
        </button>
      </div>
    </>
  );
}
