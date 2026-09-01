"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import type { CaseStudy } from "@/data/caseStudies";

/* Well-formed (monotonic) ease-out curves — the earlier custom bezier had a
   second control point with a lower x than the first, which is an invalid
   ordering for a clean easing shape and produced a mid-transition snap. */
const RELEASE_EASE = "[transition-timing-function:cubic-bezier(0.16,1,0.3,1)]";
const PULL_EASE = "[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]";

/* Mirrors the timing baked into the record-inspect / record-front-vis
   keyframes below, so JS can tell whether a given hover session ended while
   the record was visibly overlapping the sleeve. */
const INSPECT_DELAY_MS = 7000;
const INSPECT_PERIOD_MS = 14000;
const OVERLAP_WINDOW: [number, number] = [800, 3600];

function wasInspecting(elapsedMs: number) {
  if (elapsedMs < INSPECT_DELAY_MS) return false;
  const cyclePos = (elapsedMs - INSPECT_DELAY_MS) % INSPECT_PERIOD_MS;
  return cyclePos >= OVERLAP_WINDOW[0] && cyclePos <= OVERLAP_WINDOW[1];
}

const DROP_DURATION = 0.55;
/* easeInQuad — real gravity is y ∝ t², so velocity ramps linearly with
   time rather than the slower, more hesitant curve used before. */
const GRAVITY_EASE: [number, number, number, number] = [0.11, 0, 0.5, 0];

/* The fumble: a standalone record, portaled to document.body so it renders
   above literally everything on the page (not just this card's stacking
   context) and falls relative to the real viewport. Starts from the exact
   screen position it was caught at (captured via getBoundingClientRect the
   instant the mouse leaves), so it visibly continues from wherever the
   inspection swing happened to be — no snap to some reset position first. */
function FallingRecord({
  disc,
  rect,
  onLanding,
  onDone,
}: {
  disc: string;
  rect: DOMRect;
  onLanding: () => void;
  onDone: () => void;
}) {
  const fallDistance = window.innerHeight - rect.top + rect.height + 80;

  return createPortal(
    <motion.div
      initial={{ y: 0, rotate: 0 }}
      animate={{ y: fallDistance, rotate: 300 }}
      transition={{ duration: DROP_DURATION, ease: GRAVITY_EASE }}
      onUpdate={(latest) => {
        if (typeof latest.y === "number" && latest.y >= fallDistance * 0.82) onLanding();
      }}
      onAnimationComplete={onDone}
      style={{
        position: "fixed",
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        zIndex: 9999,
        pointerEvents: "none",
      }}
      className="overflow-hidden rounded-full bg-black"
    >
      <img src={disc} alt="" className="h-full w-full object-cover" draggable={false} />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_38%,transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"
      />
    </motion.div>,
    document.body,
  );
}

/* A subtle, page-wide flash in the background's own tone (not a bright white
   wash on the sleeve) representing the impact when the fumbled record hits
   the floor, out of view. */
function ImpactFlash({ onDone }: { onDone: () => void }) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.16, 0] }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      onAnimationComplete={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "#5a5a5a",
        pointerEvents: "none",
      }}
    />,
    document.body,
  );
}

/* The full animated disc stack: pull-out transition, inspection swing, idle
   breathe/consider loops, and the circular artwork. Rendered twice per card —
   once behind the sleeve (the primary, carrying the layoutId) and once above
   it (a clone that crossfades in during the inspection) — so the record can
   pass in front of the jacket without a z-index pop. Identical animation
   parameters keep both copies pixel-locked.

   The disc rests fully hidden behind the sleeve. The pull is split into two
   chained phases so it never looks like it "blips" into view: a quick, short
   release (0 -> 14%, 160ms, no delay) gets it clear of the sleeve's edge
   fast, then a slower dramatic draw (14% -> 46% total, delayed to start
   right as the release finishes) carries it the rest of the way. Re-park
   runs the same two transitions in reverse. */
function DiscStack({ disc }: { disc: string }) {
  return (
    <div
      className={`h-full w-full transition-transform duration-[160ms] ${RELEASE_EASE} motion-safe:group-hover:translate-x-[14%]`}
    >
      <div
        className={`h-full w-full transition-[transform,filter] delay-[160ms] duration-[700ms] ${PULL_EASE} [filter:drop-shadow(-4px_5px_10px_rgba(0,0,0,0.55))] motion-safe:group-hover:translate-x-[32%] motion-safe:group-hover:rotate-[12deg] motion-safe:group-hover:[filter:drop-shadow(-10px_14px_24px_rgba(0,0,0,0.65))]`}
      >
        {/* full inspection on long hover: pull clear, swing over the sleeve,
            hold, reseat */}
        <div className="h-full w-full motion-safe:group-hover:animate-[record-inspect_14s_ease-in-out_7s_infinite]">
          {/* idle loop: dramatic further pull-outs with holds */}
          <div className="h-full w-full motion-safe:group-hover:animate-[record-breathe_7.5s_ease-in-out_0.9s_infinite]">
            {/* idle loop: twists back and forth — reading the label */}
            <div className="h-full w-full motion-safe:group-hover:animate-[record-consider_6.5s_ease-in-out_1.2s_infinite]">
              <div className="relative h-full w-full overflow-hidden rounded-full bg-black">
                <img src={disc} alt="" className="h-full w-full object-cover" draggable={false} />
                {/* vinyl sheen */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_38%,transparent_62%)]"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SleeveCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const { slug, title, role, year, disc, sleeve } = caseStudy;
  const hoverStartRef = useRef<number | null>(null);
  const frontDiscRef = useRef<HTMLDivElement>(null);
  const [fallenRect, setFallenRect] = useState<DOMRect | null>(null);
  const [flashing, setFlashing] = useState(false);
  const flashFiredRef = useRef(false);
  /* The most recently observed on-screen rect of the front disc, sampled
     every animation frame while hovering. By the time a mouseleave handler
     runs, the browser has typically already recalculated styles for the
     no-longer-hovering state — the inner swing/breathe/consider keyframe
     animations vanish instantly when :hover stops matching (animations,
     unlike transitions, don't tween out), so a fresh getBoundingClientRect
     taken inside the handler tends to capture an already-snapped-back
     position rather than the true mid-swing one. Polling continuously and
     using the last sample taken *while still hovering* sidesteps that. */
  const lastRectRef = useRef<DOMRect | null>(null);
  const pollRef = useRef<number | null>(null);

  function pollRect() {
    if (frontDiscRef.current) lastRectRef.current = frontDiscRef.current.getBoundingClientRect();
    pollRef.current = requestAnimationFrame(pollRect);
  }

  function handleMouseEnter() {
    hoverStartRef.current = Date.now();
    if (pollRef.current === null) pollRef.current = requestAnimationFrame(pollRect);
  }

  function handleMouseLeave() {
    if (pollRef.current !== null) {
      cancelAnimationFrame(pollRef.current);
      pollRef.current = null;
    }
    const start = hoverStartRef.current;
    hoverStartRef.current = null;
    if (start === null || !wasInspecting(Date.now() - start)) return;
    const rect = lastRectRef.current;
    if (!rect) return;
    flashFiredRef.current = false;
    setFallenRect(rect);
  }

  return (
    <Link
      href={`/case-studies/${slug}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative z-0 block hover:z-20"
    >
      <div className="relative transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:-translate-y-1">
        {/* Back of the sleeve — carries the exact same transform stack as the
            front cover so the two panels move as one attached object, with a
            small constant offset for the jacket's thickness. The record exits
            the slot between them. */}
        <div
          className={`absolute inset-0 z-0 transition-transform duration-[900ms] ${PULL_EASE} motion-safe:group-hover:-translate-x-[5%] motion-safe:group-hover:-rotate-[2.5deg]`}
        >
          <div className="h-full w-full motion-safe:group-hover:animate-[sleeve-inspect_14s_ease-in-out_7s_infinite]">
            <div className="h-full w-full motion-safe:group-hover:animate-[sleeve-drift_17s_ease-in-out_1.5s_infinite]">
              <div className="relative left-[1%] top-[0.8%] h-full w-full overflow-hidden rounded-[3px]">
                {sleeve ? (
                  <img
                    src={sleeve}
                    alt=""
                    className="h-full w-full object-cover brightness-[0.4] saturate-75"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-[#161412] to-[#0c0b0a]" />
                )}
                {/* cavity shading where the record sits */}
                <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/35" />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-[14%] bg-gradient-to-l from-black/60 to-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Vinyl disc — between back and front, hidden until pulled out */}
        <motion.div layoutId={`disc-${slug}`} className="absolute inset-x-[4%] top-[4%] z-[1] aspect-square">
          <DiscStack disc={disc} />
        </motion.div>

        {/* Front of the sleeve — tilts and slides left as the record is pulled */}
        <div
          className={`relative z-10 transition-transform duration-[900ms] ${PULL_EASE} motion-safe:group-hover:-translate-x-[5%] motion-safe:group-hover:-rotate-[2.5deg]`}
        >
          <div className="motion-safe:group-hover:animate-[sleeve-inspect_14s_ease-in-out_7s_infinite]">
            <div className="motion-safe:group-hover:animate-[sleeve-drift_17s_ease-in-out_1.5s_infinite]">
              <div className="relative aspect-square overflow-hidden rounded-[3px] ring-1 ring-white/10 shadow-[0_2px_3px_rgba(0,0,0,0.6),0_14px_30px_rgba(0,0,0,0.45)] transition-shadow duration-[900ms] group-hover:shadow-[0_3px_5px_rgba(0,0,0,0.65),0_22px_44px_rgba(0,0,0,0.55)]">
                {sleeve ? (
                  <img
                    src={sleeve}
                    alt={`${title} album sleeve`}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#26231f] to-[#141312] px-4 text-center">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/40">
                      Maloto Records
                    </span>
                    <span className="text-sm font-semibold uppercase tracking-wide text-foreground/85">
                      {title}
                    </span>
                    <span className="text-[10px] text-foreground/40">{year}</span>
                  </div>
                )}
                {/* opening-slot shadow along the right edge, where the record exits */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-[7%] bg-gradient-to-l from-black/45 to-transparent"
                />
                {/* paper edge highlight */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[3px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Front-layer disc clone — identical animation stack, crossfaded in
            while the record swings in front of the jacket during inspection.
            Its position while visible is what the fall is caught from. */}
        <div
          ref={frontDiscRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-[4%] top-[4%] z-[15] aspect-square opacity-0 motion-safe:group-hover:animate-[record-front-vis_14s_linear_7s_infinite]"
        >
          <DiscStack disc={disc} />
        </div>
      </div>

      <div className="mt-4">
        <span className="block truncate text-sm font-medium sm:text-base">{title}</span>
        <span className="block text-xs text-foreground/60 sm:text-sm">
          {role} · {year}
        </span>
      </div>

      {fallenRect && (
        <FallingRecord
          disc={disc}
          rect={fallenRect}
          onLanding={() => {
            if (flashFiredRef.current) return;
            flashFiredRef.current = true;
            setFlashing(true);
          }}
          onDone={() => setFallenRect(null)}
        />
      )}
      {flashing && <ImpactFlash onDone={() => setFlashing(false)} />}
    </Link>
  );
}
