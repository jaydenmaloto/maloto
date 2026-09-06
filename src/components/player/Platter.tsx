"use client";

import { motion } from "framer-motion";

/* Matches the spring CaseStudyHero uses for its own disc, so a record flying
   from a grid card to the deck lands with the same weight the hero landing
   has today. */
const RECORD_SPRING = { type: "spring", stiffness: 170, damping: 26, mass: 0.9 } as const;

/* Lifted verbatim from CaseStudyHero — the turntable flick (two revolutions,
   easing out) chained into the steady idle rotation. */
const SPIN =
  "motion-safe:animate-[record-spinup_1.5s_cubic-bezier(0.2,0.6,0.3,1)_0.35s_1_both,record-spin_22s_linear_1.85s_infinite]";

export interface PlatterProps {
  /* Artwork on the platter. null renders a blank record — the empty deck. */
  src: string | null;
  alt?: string;
  /* Set only when this platter is the live holder of the shared layout id.
     See the ownership rule in VinylDock. */
  layoutId?: string;
  spinning?: boolean;
  /* Sizing and positioning for the outer square. */
  className?: string;
}

export function Platter({ src, alt = "", layoutId, spinning = true, className }: PlatterProps) {
  return (
    <motion.div
      /* `layout` is carried in addition to `layoutId` on purpose. The dock
         shell above this node animates between two very different boxes, and
         without its own layout projection this record would be stretched by
         the parent's scale for the length of that transition. */
      layout
      layoutId={layoutId}
      transition={RECORD_SPRING}
      className={`relative aspect-square overflow-hidden rounded-full bg-black shadow-2xl ${className ?? ""}`}
    >
      <div
        /* Re-keyed on the artwork so swapping records replays the spin-up
           flick rather than continuing mid-rotation. */
        key={src ?? "empty"}
        className={`h-full w-full ${SPIN}`}
        style={{ animationPlayState: spinning ? "running" : "paused" }}
      >
        {src && (
          <img
            src={src}
            alt={alt}
            className="pointer-events-none h-full w-full select-none object-cover"
            draggable={false}
          />
        )}
      </div>

      {/* vinyl sheen — same treatment as the discs in SleeveCard */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.22),rgba(255,255,255,0.05)_38%,transparent_62%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/10"
      />
    </motion.div>
  );
}
