"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { buildTimeline, type TimelineEntry } from "@/data/caseStudies";

/* Gutter width, and therefore the centre line the channel is milled on. */
const GUTTER = 28;
const CENTRE = GUTTER / 2;
/* Channel width. Notches cross it symmetrically, so they stay inside the
   gutter — hanging them off to one side, as the CDJ does, would overflow. */
const SLOT_W = 5;

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

/* One scroll listener drives the cap's position and which notches are lit, so
   a notch can never light early or late relative to the cap — they are the
   same measurement. Neither writes React state: the position goes out as a
   custom property and the notches as data attributes, so scrolling never
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
         positioned, so mixing the two frames put every notch at a negative
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

      /* The cap's travel is mapped to how far the document has scrolled, not
         to a fixed line down the viewport.

         A viewport playhead is the obvious approach and it was the first one
         here, but it silently breaks on a short page: with four studies the
         document only scrolls ~480px, the foot of the rail never reaches the
         line, and half the notches could never light at all. Mapping to scroll
         progress guarantees the cap traverses the whole channel and every
         notch gets passed, however little content there is.

         When the rail is most of the page — which it is here — the two
         behave almost identically anyway: the cap's drift down the track
         cancels the track's own scrolling, so it still reads as a playhead
         holding position while the notches move past it.

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
           firing on both transitions re-triggered every notch on the way up
           and read as noise rather than as a detent. */
        if (!lit || wasLit) continue;
        /* Restart the pulse by removing the attribute, forcing a reflow so the
           browser drops the old animation, then re-adding. The forced reflow
           only happens on the handful of frames where the cap passes a notch. */
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
       every notch underneath them. */
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

/* A milestone notch, crossing the channel symmetrically. Companies get a wider,
   heavier mark than studies, which is what carries the hierarchy the old dots
   carried through size. */
function Tick({ major, accent }: { major?: boolean; accent?: string }) {
  return (
    <span
      data-tick
      aria-hidden
      /* relative so it paints above the channel. The channel is absolutely
         positioned and the notches are in normal flow, so without this the
         channel wins the paint order and each notch reads as two disconnected
         dashes either side of the slot rather than one stamped detent. */
      className="relative mt-2 block shrink-0 rounded-[1px] transition-colors duration-300"
      style={{
        width: major ? 21 : 13,
        height: major ? 3 : 2,
        ["--lit" as string]: accent ?? "var(--rail-lit)",
      }}
    />
  );
}

/* A row: fixed gutter holding the notch, then the content. Keeping the notch
   in the row's own flow is what makes it line up with the heading beside it. */
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

/* The fader's ends. A tempo fader runs minus at the top to plus at the bottom,
   which is also the way round the CDJ has it: pushing the cap down raises
   tempo. */
function EndGlyph({ sign }: { sign: "plus" | "minus" }) {
  return (
    <div
      /* Margin on the side facing the channel, so each glyph sits clear of the
         track rather than crowding its end. Direction-aware because the minus
         is above the rail and the plus below it. */
      className={`flex ${sign === "minus" ? "mb-5" : "mt-5"}`}
      style={{ width: GUTTER }}
      aria-hidden
    >
      <svg
        width={GUTTER}
        height={20}
        viewBox={`0 0 ${GUTTER} 20`}
        /* Faint on purpose: these mark the fader's ends, they are not
           milestones, and at full strength they competed with the notches. */
        className="block opacity-[0.35]"
      >
        <g stroke="var(--rail-lit)" strokeWidth={1.5} strokeLinecap="round">
          <line x1={CENTRE - 6} y1={10} x2={CENTRE + 6} y2={10} />
          {sign === "plus" && <line x1={CENTRE} y1={4} x2={CENTRE} y2={16} />}
        </g>
      </svg>
    </div>
  );
}

/* Rendered only on the browsing view. The case study page drops the timeline
   entirely rather than keeping it as a sidebar, so there is no compact or
   selected variant to carry here. */
export function Timeline({ onNavigate }: { onNavigate: (href: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useScrollLitRail(containerRef);
  const entries = buildTimeline();

  return (
    <div>
      <EndGlyph sign="minus" />

      {/* pt gives the channel a run of clear track above the first notch — the
          head the curve used to occupy. The channel is absolutely positioned
          across the whole container, so it covers the padding without needing
          an element of its own. */}
      <div ref={containerRef} className="relative pt-24">
        {/* The channel: milled into the page rather than drawn on it, with the
            CDJ's dense measurement scale coming free from a repeating gradient
            instead of generated elements — no DOM cost, and it scales to
            whatever height the rail ends up. */}
        <div
          aria-hidden
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: CENTRE - SLOT_W / 2,
            width: SLOT_W,
            /* Graduations kept faint on purpose. At full strength they read
               as a dashed line and swallowed the milestone notches sitting on
               top of them; the slot has to stay a surface, not a pattern. */
            background: `repeating-linear-gradient(
              to bottom,
              rgba(120,126,140,0.16) 0px, rgba(120,126,140,0.16) 1px,
              var(--slot) 1px, var(--slot) 7px
            )`,
            boxShadow: "inset 0 1px 2px rgba(30,32,40,0.18), 0 1px 0 rgba(255,255,255,0.8)",
          }}
        />

        {/* Traversed distance. Real faders don't fill, but the cue is worth the
            small departure — it is what makes the cap read as having come from
            somewhere. */}
        <div
          aria-hidden
          className="absolute top-0 rounded-full"
          style={{
            left: CENTRE - SLOT_W / 2,
            width: SLOT_W,
            height: "var(--timeline-fill, 0px)",
            background: "var(--slot-used)",
            /* Same inset lip as the channel, so the trail reads as the same
               milled slot in a worn tone rather than a bar laid over it. */
            boxShadow: "inset 0 1px 2px rgba(30,32,40,0.18)",
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
                    <span className="block text-sm font-semibold">{study.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-muted">
                      {study.subtitle}
                    </span>
                  </span>
                </Link>
              </Row>
            );
          })}
        </div>

        {/* The cap. Driven by the same --timeline-fill the notches are compared
            against, so it cannot drift out of sync with them — one measurement,
            one source of truth. */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0"
          style={{
            left: CENTRE - 11,
            width: 22,
            height: 10,
            transform: "translateY(calc(var(--timeline-fill, 0px) - 5px))",
            borderRadius: 3,
            background: "linear-gradient(160deg, #ffffff 0%, var(--cap) 42%, #dcdee2 100%)",
            border: "1px solid var(--cap-edge)",
            boxShadow: "0 1px 2px rgba(24,26,32,0.28), inset 0 1px 0 rgba(255,255,255,0.9)",
          }}
        >
          {/* grip line down the middle of the cap */}
          <span
            className="absolute inset-x-1 top-1/2 block h-px -translate-y-1/2"
            style={{ background: "rgba(70,74,84,0.45)" }}
          />
        </div>
      </div>

      <EndGlyph sign="plus" />
    </div>
  );
}
