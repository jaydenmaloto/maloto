"use client";

import { motion } from "framer-motion";
import { Platter } from "@/components/player/Platter";
import { usePlayerActions, usePlayerState } from "@/components/player/PlayerProvider";

const DOCK_SPRING = { type: "spring", stiffness: 150, damping: 24, mass: 1 } as const;

/* The intro fills the viewport; the docked column is a fixed left rail. Both
   are the *same* DOM node — swapping between these two class strings and
   letting Framer Motion's layout projection animate the box change is what
   makes the player read as one physical object being moved, rather than one
   element disappearing and another appearing somewhere else.

   The `lg:flex` on the docked shell must stay in lockstep with the --dock-w
   media queries in globals.css and DOCK_QUERY in PlayerProvider. */
const INTRO_SHELL =
  "fixed inset-0 z-30 flex flex-col items-center justify-center gap-8 bg-background px-6";
const DOCKED_SHELL =
  "fixed left-0 top-0 z-30 hidden h-dvh w-[var(--dock-w)] flex-col items-center justify-center gap-5 px-6 lg:flex";

export function VinylDock() {
  const { phase, nowPlaying, nowPlayingSlug, dockActive, hydrated, skipIntroAnimation, muted } =
    usePlayerState();
  const { enter, toggleMuted } = usePlayerActions();

  const isIntro = phase === "intro";

  /* Ownership of the shared layout id, written out because getting it wrong
     is the one thing that visibly breaks the record flight:

       dockActive false (< lg)  SleeveCard's grid disc + CaseStudyHero's disc,
                                exactly as before this dock existed
       dockActive true  (>= lg) SleeveCard's grid disc + this platter, and the
                                hero yields by passing undefined

     Either way there are at most two live holders, the same as today. The
     dock wins on desktop because the whole point is that the record you pick
     goes onto the player. */
  const platterLayoutId = dockActive && nowPlayingSlug ? `disc-${nowPlayingSlug}` : undefined;

  /* Below lg the docked shell is `hidden`, so animating into it would mean
     animating into a zero-sized box. There, the intro simply crossfades out
     instead — the "slides over and docks" beat is a desktop affordance. A
     repeat in-session load skips the animation too, landing docked directly. */
  const animateDock = dockActive && !skipIntroAnimation;

  return (
    <motion.div
      layout={animateDock}
      transition={DOCK_SPRING}
      className={`${isIntro ? INTRO_SHELL : DOCKED_SHELL} transition-opacity duration-150 ${
        hydrated ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* The plinth. Thin on purpose for this structural pass: the same
          alpha-on-foreground depth idiom the rest of the site uses, no
          materials yet. The skeuomorphic pass builds wood, felt, a spindle
          and a brushed rim out from here. */}
      <motion.div
        layout={animateDock}
        transition={DOCK_SPRING}
        className={`relative w-full rounded-2xl border border-foreground/10 bg-foreground/[0.03] p-5 ${
          isIntro ? "max-w-sm" : ""
        }`}
      >
        <Platter
          src={nowPlaying?.disc ?? null}
          alt={nowPlaying ? `${nowPlaying.title} record` : ""}
          layoutId={platterLayoutId}
          spinning={nowPlaying !== null}
        />
        {/* The tonearm attaches here in the styling pass: an absolutely
            positioned sibling of the platter, pivoting from the top right and
            rotated through a --tonearm-deg custom property that flips between
            its rest and cue angles as nowPlayingSlug changes. */}
      </motion.div>

      <motion.div
        layout={animateDock}
        transition={DOCK_SPRING}
        className="flex w-full flex-col items-center gap-1 text-center"
      >
        {nowPlaying ? (
          <>
            <span className="text-sm font-medium">{nowPlaying.title}</span>
            <span className="text-xs text-foreground/60">
              {nowPlaying.role} · {nowPlaying.year}
            </span>
          </>
        ) : (
          <span className="text-xs text-foreground/45">
            {isIntro ? "Maloto Records" : "Nothing on the deck"}
          </span>
        )}

        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={muted}
          title="Audio coming soon"
          className="mt-2 rounded-full border border-foreground/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-foreground/45 transition-colors hover:text-foreground/70 active:opacity-70"
        >
          {muted ? "Muted" : "Sound"}
        </button>
      </motion.div>

      {isIntro && (
        <motion.button
          layout={animateDock}
          transition={DOCK_SPRING}
          type="button"
          onClick={enter}
          className="rounded-full border border-foreground/15 px-6 py-2.5 text-sm text-foreground/85 transition-colors hover:border-foreground/30 hover:text-foreground active:opacity-70"
        >
          Drop the needle
        </motion.button>
      )}
    </motion.div>
  );
}
