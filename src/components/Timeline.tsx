"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { buildTimeline, type TimelineEntry } from "@/data/caseStudies";

/* Where down the viewport the "playhead" sits. The fill reaches a dot at the
   moment that dot crosses this line. */
const PLAYHEAD = 0.45;
/* Gutter width, and therefore the centre line the rail is drawn on. */
const GUTTER = 24;

function entryKey(entry: TimelineEntry) {
  return entry.kind === "company" ? `company:${entry.company.id}` : `study:${entry.study.slug}`;
}

/* One scroll listener drives both the fill height and which dots are lit, so
   a dot can never light early or late relative to the line — they are the
   same measurement. Neither writes React state: the fill goes out as a custom
   property and the dots as a data attribute, so scrolling never re-renders. */
function useScrollLitRail(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let dots: { el: HTMLElement; offset: number }[] = [];
    let frame = 0;

    function measure() {
      const el = containerRef.current;
      if (!el) return;
      /* Measured off bounding rects rather than offsetTop. offsetTop is
         relative to each element's own offsetParent, and the container is
         positioned, so mixing the two frames put every dot at a negative
         offset and lit the whole rail on load. Both rects are read in the same
         frame, so the delta between them is scroll-independent. */
      const base = el.getBoundingClientRect().top;
      dots = [...el.querySelectorAll<HTMLElement>("[data-dot]")].map((dot) => {
        const rect = dot.getBoundingClientRect();
        return { el: dot, offset: rect.top - base + rect.height / 2 };
      });
      paint();
    }

    function paint() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const playhead = window.innerHeight * PLAYHEAD;
      const fill = Math.max(0, Math.min(playhead - rect.top, rect.height));
      el.style.setProperty("--timeline-fill", `${fill}px`);
      for (const dot of dots) {
        /* toggle() with an explicit second argument is idempotent, so this is
           a no-op write on the frames where nothing changed. */
        dot.el.toggleAttribute("data-lit", dot.offset <= fill);
      }
    }

    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        paint();
      });
    }

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    /* Content height changes as fonts load and images decode, which moves
       every dot underneath them. */
    const observer = new ResizeObserver(measure);
    observer.observe(container);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [containerRef]);
}

function Dot({ big, accent }: { big?: boolean; accent?: string }) {
  const size = big ? 13 : 7;
  return (
    <span
      data-dot
      aria-hidden
      /* Background is deliberately NOT set inline: an inline style would beat
         the [data-lit] rule in globals.css and the dot could never light. Only
         --lit (the colour it lights *to*) is passed in — companies use their
         own accent, studies fall back to the rail indigo. */
      className="mt-1.5 block shrink-0 rounded-full transition-colors duration-300"
      style={{ width: size, height: size, ["--lit" as string]: accent ?? "var(--rail-lit)" }}
    />
  );
}

/* A row: fixed gutter holding the dot, then the content. Keeping the dot in
   the row's own flow is what makes it line up with the heading beside it. */
function Row({ children, dot }: { children: React.ReactNode; dot: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex shrink-0 justify-center" style={{ width: GUTTER }}>
        {dot}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* The play glyph and the curve sweeping down into the head of the rail. Drawn
   permanently lit: it reads as the start of the played path, and it sits above
   the measured region so it never participates in the fill. The curve lands at
   x = GUTTER / 2, which is exactly where the track is drawn. */
function LeadIn() {
  return (
    <svg width={80} height={62} viewBox="0 0 80 62" aria-hidden className="block overflow-visible">
      <path d="M 44 6 L 56 13 L 44 20 Z" fill="var(--rail-lit)" />
      <path
        d={`M 50 24 C 50 46, ${GUTTER / 2} 38, ${GUTTER / 2} 62`}
        fill="none"
        stroke="var(--rail-lit)"
        strokeWidth={1}
      />
    </svg>
  );
}

export function Timeline({ selectedSlug }: { selectedSlug: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollLitRail(containerRef);
  const entries = buildTimeline();
  const compact = selectedSlug !== null;

  return (
    <div>
      <LeadIn />
      <div ref={containerRef} className="relative">
      {/* the track and the fill that runs down it */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 w-px"
        style={{ left: GUTTER / 2, background: "var(--rail)" }}
      />
      <div
        aria-hidden
        className="absolute top-0 w-px"
        style={{
          left: GUTTER / 2,
          height: "var(--timeline-fill, 0px)",
          background: "var(--rail-lit)",
        }}
      />

      <div className={compact ? "flex flex-col gap-5" : "flex flex-col gap-10"}>
        {entries.map((entry) => {
          if (entry.kind === "company") {
            const { company } = entry;
            return (
              <Row key={entryKey(entry)} dot={<Dot big accent={company.accent} />}>
                <h2 className="text-lg font-semibold tracking-tight" style={{ color: company.accent }}>
                  {company.name}
                </h2>
                <p className="text-lg tracking-tight">{company.role}</p>
                {!compact && (
                  <>
                    <p className="mt-0.5 text-xs text-muted">{company.period}</p>
                    <p className="mt-3 max-w-prose text-sm leading-6 text-muted">{company.blurb}</p>
                  </>
                )}
              </Row>
            );
          }

          const { study } = entry;
          const isSelected = study.slug === selectedSlug;
          return (
            <Row key={entryKey(entry)} dot={<Dot />}>
              <Link
                href={`/case-studies/${study.slug}`}
                aria-current={isSelected ? "page" : undefined}
                className={`group flex gap-4 rounded-lg outline-offset-4 transition-opacity ${
                  isSelected ? "" : "hover:opacity-70"
                }`}
              >
                {study.sleeve && (
                  /* next/image earns its keep here: the sleeve PNGs are
                     500-660KB apiece and this renders them at 64px. */
                  <Image
                    src={study.sleeve}
                    alt=""
                    width={64}
                    height={64}
                    className={`shrink-0 rounded-sm border border-hairline object-cover ${
                      compact ? "h-[34px] w-[34px]" : "h-16 w-16"
                    }`}
                  />
                )}
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-semibold ${
                      isSelected ? "underline decoration-2 underline-offset-4" : ""
                    }`}
                  >
                    {study.title}
                  </span>
                  {!compact && (
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted">
                      {study.subtitle}
                    </span>
                  )}
                </span>
              </Link>
            </Row>
          );
          })}
        </div>
      </div>
    </div>
  );
}
