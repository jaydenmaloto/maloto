"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { buildTimeline, type TimelineEntry } from "@/data/caseStudies";

/* Gutter width, and therefore the centre line the rail runs down. */
const GUTTER = 28;
const CENTRE = GUTTER / 2;
/* Hairline track. Wide enough to read at a glance, thin enough to stay
   furniture rather than a component in its own right. */
const RAIL_W = 2;
/* Milestone dots. Companies get the larger one, which is what carries the
   hierarchy the old notch widths carried. */
const DOT = 6;
const DOT_MAJOR = 10;
/* The leading edge of the fill. Slightly larger than a milestone so it reads
   as the thing doing the moving. */
const HEAD = 8;

/* Records already fetched. The HTTP cache dedupes anyway; this just avoids
   creating an Image on every pointer event. */
const warmed = new Set<string>();

/* The list view never renders a record — only sleeves — so the first click on
   a project fetches its disc PNG cold (107KB for most, 545KB for anthm) and
   the platter sits bare until it lands. Warming it on intent means it is
   already cached by the time the click happens. */
function warmDisc(src: string) {
  if (warmed.has(src)) return;
  warmed.add(src);
  /* window.Image, not Image: next/image is imported into this module under
     that name and shadows the DOM constructor. */
  const img = new window.Image();
  img.src = src;
}

function entryKey(entry: TimelineEntry) {
  return entry.kind === "company" ? `company:${entry.company.id}` : `study:${entry.study.slug}`;
}

/* One scroll listener drives the fill's height and which dots are lit, so a
   dot can never light early or late relative to the leading edge — they are
   the same measurement. Neither writes React state: the position goes out as a
   custom property and the dots as data attributes, so scrolling never
   re-renders. */
function useScrollLitRail(containerRef: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let ticks: { el: HTMLElement; offset: number }[] = [];
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
      ticks = [...el.querySelectorAll<HTMLElement>("[data-tick]")].map((tick) => {
        const rect = tick.getBoundingClientRect();
        return { el: tick, offset: rect.top - base + rect.height / 2 };
      });
      paint();
    }

    function paint() {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();

      /* The fill's travel is mapped to how far the document has scrolled, not
         to a fixed line down the viewport.

         A viewport playhead is the obvious approach and it was the first one
         here, but it silently breaks on a short page: with four studies the
         document only scrolls ~480px, the foot of the rail never reaches the
         line, and half the dots could never light at all. Mapping to scroll
         progress guarantees the fill traverses the whole track and every
         milestone gets passed, however little content there is.

         When the rail is most of the page — which it is here — the two
         behave almost identically anyway: the head's drift down the track
         cancels the track's own scrolling, so it still reads as a playhead
         holding position while the rows move past it.

         A page that doesn't scroll at all has been seen in full, so
         everything counts as reached. */
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 1;
      const fill = Math.max(0, Math.min(progress * rect.height, rect.height));
      el.style.setProperty("--timeline-fill", `${fill}px`);

      for (const tick of ticks) {
        const lit = tick.offset <= fill;
        const wasLit = tick.el.hasAttribute("data-lit");
        /* toggle() with an explicit second argument is idempotent, so this is
           a no-op write on the frames where nothing changed. */
        tick.el.toggleAttribute("data-lit", lit);
        /* Forward crossings only. Unlighting on the way back up stays silent:
           firing on both transitions re-triggered every dot on the way up and
           read as noise rather than as an arrival. */
        if (!lit || wasLit) continue;
        /* Restart the pulse by removing the attribute, forcing a reflow so the
           browser drops the old animation, then re-adding. The forced reflow
           only happens on the handful of frames where the head passes a dot. */
        tick.el.removeAttribute("data-pulse");
        void tick.el.offsetWidth;
        tick.el.setAttribute("data-pulse", "");
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

/* A milestone dot sitting on the track. The page-coloured ring is what lets it
   sit *on* the rail rather than the rail running visibly through it — cheaper
   and crisper than masking the track behind each one. */
function Tick({ major, accent }: { major?: boolean; accent?: string }) {
  const size = major ? DOT_MAJOR : DOT;
  return (
    <span
      data-tick
      aria-hidden
      /* relative so it paints above the track, which is absolutely positioned
         while the dots sit in normal flow. mt lines the dot up with the middle
         of the first line of the heading beside it — the two sizes pair with
         the two type sizes, so they need different offsets. */
      className={`relative block shrink-0 rounded-full ${major ? "mt-2" : "mt-[7px]"}`}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 0 4px var(--background)`,
        ["--lit" as string]: accent ?? "var(--rail-lit)",
      }}
    />
  );
}

/* Three bars beside the study whose record is on the deck. Durations differ so
   they fall out of step rather than pulsing as one block; the negative delays
   mean they are already mid-cycle on the first frame instead of all starting
   flat together. Under reduced motion the animation drops and they stay at
   their static heights, so the indication survives without the movement. */
function NowPlayingBars() {
  return (
    <span className="ml-2 inline-flex h-3 items-end gap-[2px] align-middle">
      <span className="sr-only">Now playing</span>
      {[
        { h: 6, dur: "620ms", delay: "-120ms" },
        { h: 11, dur: "480ms", delay: "-320ms" },
        { h: 8, dur: "780ms", delay: "-40ms" },
      ].map((bar) => (
        <span
          key={bar.dur}
          aria-hidden
          className="block w-[2px] rounded-[1px] motion-safe:animate-[eq-bar_var(--eq-dur)_ease-in-out_var(--eq-delay)_infinite]"
          style={{
            height: bar.h,
            background: "var(--rail-lit)",
            transformOrigin: "bottom",
            ["--eq-dur" as string]: bar.dur,
            ["--eq-delay" as string]: bar.delay,
          }}
        />
      ))}
    </span>
  );
}

/* A row: fixed gutter holding the dot, then the content. Keeping the dot in
   the row's own flow is what makes it line up with the heading beside it. */
function Row({ children, tick }: { children: React.ReactNode; tick: React.ReactNode }) {
  return (
    <div className="flex gap-5">
      <div className="flex shrink-0 justify-center" style={{ width: GUTTER }}>
        {tick}
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* Rendered only on the browsing view. The case study page drops the timeline
   entirely rather than keeping it as a sidebar, so there is no compact or
   selected variant to carry here. */
export function Timeline({
  onNavigate,
  nowPlayingSlug,
}: {
  onNavigate: (href: string) => void;
  nowPlayingSlug: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollLitRail(containerRef);
  const entries = buildTimeline();

  return (
    /* pt gives the track a run of clear rail above the first milestone, so the
       progress has somewhere to start from. The track is absolutely positioned
       across the whole container, so it covers the padding without needing an
       element of its own. */
    <div ref={containerRef} className="relative pt-24">
      {/* The track. Both ends fade out rather than stopping flat: a hairline
          that simply ends reads as a cut-off border, and the fade is what
          makes it read as a continuous spine the content hangs from. */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 rounded-full"
        style={{
          left: CENTRE - RAIL_W / 2,
          width: RAIL_W,
          background: "var(--rail)",
          maskImage: "linear-gradient(to bottom, transparent, #000 56px, #000 calc(100% - 56px), transparent)",
        }}
      />

      {/* Progress. Fades in from the top for the same reason the track does,
          so the two share an edge instead of the fill starting as a hard cap
          over a ghosted track. */}
      <div
        aria-hidden
        className="absolute top-0 rounded-full"
        style={{
          left: CENTRE - RAIL_W / 2,
          width: RAIL_W,
          height: "var(--timeline-fill, 0px)",
          background: "var(--rail-lit)",
          maskImage: "linear-gradient(to bottom, transparent, #000 56px)",
        }}
      />

      {/* The leading edge, driven by the same --timeline-fill the dots are
          compared against, so it cannot drift out of sync with them — one
          measurement, one source of truth. A soft halo rather than a bevel:
          the point is to show where you are, not to look like a part. */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 rounded-full"
        style={{
          left: CENTRE - HEAD / 2,
          width: HEAD,
          height: HEAD,
          transform: `translateY(calc(var(--timeline-fill, 0px) - ${HEAD / 2}px))`,
          background: "var(--rail-lit)",
          boxShadow: "0 0 0 4px var(--background), 0 0 0 7px color-mix(in srgb, var(--rail-lit) 16%, transparent)",
        }}
      />

      <div className="flex flex-col gap-10">
        {entries.map((entry) => {
          if (entry.kind === "company") {
            const { company } = entry;
            return (
              <Row key={entryKey(entry)} tick={<Tick major accent={company.accent} />}>
                <h2
                  className="text-lg font-semibold tracking-tight"
                  style={{ color: company.accent }}
                >
                  {company.name}
                </h2>
                <p className="text-lg tracking-tight">{company.role}</p>
                <p className="mt-0.5 text-xs text-muted">{company.period}</p>
                <p className="mt-3 max-w-prose text-sm leading-6 text-muted">{company.blurb}</p>
              </Row>
            );
          }

          const { study } = entry;
          return (
            <Row key={entryKey(entry)} tick={<Tick />}>
              <Link
                href={`/case-studies/${study.slug}`}
                /* Stays a real Link so prefetch, middle-click, right-click
                   and assistive tech all keep working; only the plain left
                   click is intercepted, to run the scroll before the swap. */
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
                  e.preventDefault();
                  warmDisc(study.disc);
                  onNavigate(`/case-studies/${study.slug}`);
                }}
                onPointerEnter={() => warmDisc(study.disc)}
                onPointerDown={() => warmDisc(study.disc)}
                onFocus={() => warmDisc(study.disc)}
                className="group flex gap-4 rounded-lg outline-offset-4 transition-opacity hover:opacity-70"
              >
                {study.sleeve && (
                  /* next/image earns its keep here: the sleeve PNGs are
                     500-660KB apiece and this renders them at 64px. */
                  <Image
                    src={study.sleeve}
                    alt=""
                    width={64}
                    height={64}
                    className="h-16 w-16 shrink-0 rounded-sm border border-hairline object-cover"
                  />
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    {study.title}
                    {study.slug === nowPlayingSlug && <NowPlayingBars />}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted">
                    {study.subtitle}
                  </span>
                </span>
              </Link>
            </Row>
          );
        })}
      </div>
    </div>
  );
}
