"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { getCaseStudy, type CaseStudy } from "@/data/caseStudies";

export type PlayerPhase = "intro" | "docked";

export interface PlayerState {
  phase: PlayerPhase;
  /* Slug of the record currently on the platter; null when the deck is empty. */
  nowPlayingSlug: string | null;
  nowPlaying: CaseStudy | null;
  /* True once the viewport is wide enough for the left dock to be the active
     presentation. False on the server and through hydration. */
  dockActive: boolean;
  /* False on the server and during hydration, true afterwards. Used only to
     suppress a one-frame flash of the intro on a repeat in-session load. */
  hydrated: boolean;
  /* Set when the intro is bypassed without the visitor asking — a reload in a
     session that has already seen it, or a deep link into a case study. Those
     should land docked immediately rather than animating there. */
  skipIntroAnimation: boolean;
  /* Inert. There is no audio element yet. */
  muted: boolean;
}

export interface PlayerActions {
  /* intro -> docked. Idempotent, and records that the intro has been seen. */
  enter: () => void;
  /* Put a record on the deck. */
  play: (slug: string) => void;
  /* Lift the record off. Not wired to any UI in this pass — it exists so the
     styling pass can add a "lift the needle" gesture without reshaping the
     context. */
  stop: () => void;
  toggleMuted: () => void;
}

const CASE_STUDY_PREFIX = "/case-studies/";
const INTRO_SEEN_KEY = "maloto:intro-seen";
/* Must stay in lockstep with the --dock-w media queries in globals.css and
   the `hidden lg:flex` on the dock shell in VinylDock.tsx. */
const DOCK_QUERY = "(min-width: 64rem)";

const DEFAULT_STATE: PlayerState = {
  phase: "docked",
  nowPlayingSlug: null,
  nowPlaying: null,
  dockActive: false,
  hydrated: false,
  skipIntroAnimation: true,
  muted: true,
};

const NOOP_ACTIONS: PlayerActions = {
  enter: () => {},
  play: () => {},
  stop: () => {},
  toggleMuted: () => {},
};

/* Two contexts rather than one, and the split is load-bearing rather than
   stylistic. SleeveCard needs `play` and nothing else; if it subscribed to a
   combined context, every change of the docked record would re-render all
   four cards. That component's hover choreography is hand-tuned and its rAF
   rect-polling refs are easy to disturb, so the safest arrangement is one
   where a card *cannot* re-render from player state at all. The actions
   object below is memoised with a stable identity for the provider's whole
   lifetime, which is what makes that guarantee hold. */
const StateContext = createContext<PlayerState>(DEFAULT_STATE);
const ActionsContext = createContext<PlayerActions>(NOOP_ACTIONS);

export function usePlayerState() {
  return useContext(StateContext);
}

export function usePlayerActions() {
  return useContext(ActionsContext);
}

function slugFromPathname(pathname: string) {
  if (!pathname.startsWith(CASE_STUDY_PREFIX)) return null;
  const rest = pathname.slice(CASE_STUDY_PREFIX.length);
  /* Guard against a trailing slash or a deeper path resolving to something
     that is not a real slug segment. */
  return rest.length > 0 && !rest.includes("/") ? rest : null;
}

/* The two browser-only facts the player needs are read through
   useSyncExternalStore rather than an effect-plus-setState. Both are genuinely
   external stores, and this way React renders the server snapshot during
   hydration and the live one immediately after, with no cascading render and
   no risk of a markup mismatch. */

function subscribeToDockQuery(onChange: () => void) {
  const query = window.matchMedia(DOCK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getDockSnapshot() {
  return window.matchMedia(DOCK_QUERY).matches;
}

function subscribeToIntroSeen(onChange: () => void) {
  /* Only ever written by enter(), which also flips local state, so this
     subscription exists purely so a second tab in the same session stays
     consistent. */
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getIntroSeenSnapshot() {
  try {
    return window.sessionStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    /* Safari private mode throws on storage access. Treat it as unseen. */
    return false;
  }
}

/* `hydrated` has no external store to watch — it only needs to differ between
   the server snapshot and the client one — so it subscribes to nothing. */
function subscribeToNothing() {
  return () => {};
}

const serverFalse = () => false;
const clientTrue = () => true;

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slugFromPath = slugFromPathname(pathname);

  const dockActive = useSyncExternalStore(subscribeToDockQuery, getDockSnapshot, serverFalse);
  const hydrated = useSyncExternalStore(subscribeToNothing, clientTrue, serverFalse);
  /* The intro is a once-per-session front door: a new tab gets it, a reload
     in the same tab does not. */
  const introSeen = useSyncExternalStore(subscribeToIntroSeen, getIntroSeenSnapshot, serverFalse);

  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(true);
  /* Remembers the last record put on the deck so it survives the URL falling
     back to "/" when the modal closes. Seeded from the initial URL so a deep
     link into a case study keeps its record docked after navigating home. */
  const [lastPlayedSlug, setLastPlayedSlug] = useState<string | null>(slugFromPath);

  const actions = useMemo<PlayerActions>(
    () => ({
      enter: () => {
        setEntered(true);
        try {
          window.sessionStorage.setItem(INTRO_SEEN_KEY, "1");
        } catch {
          /* Non-fatal: the intro simply plays again next load. */
        }
      },
      play: (slug: string) => setLastPlayedSlug(slug),
      stop: () => setLastPlayedSlug(null),
      toggleMuted: () => setMuted((value) => !value),
    }),
    [],
  );

  const state = useMemo<PlayerState>(() => {
    /* Everything below is derived, never synchronised through an effect. The
       URL wins over memory so a deep link is correct on first paint, and
       memory covers the case where the URL has fallen back to "/". */
    const nowPlayingSlug = slugFromPath ?? lastPlayedSlug;
    /* Reasons to be docked without the visitor having asked for it. */
    const bypassed = slugFromPath !== null || introSeen;

    return {
      phase: bypassed || entered ? "docked" : "intro",
      nowPlayingSlug,
      nowPlaying: nowPlayingSlug ? getCaseStudy(nowPlayingSlug) ?? null : null,
      dockActive,
      hydrated,
      /* The `!entered` matters more than it looks: enter() writes the session
         flag, so introSeen goes true on the very render that begins the
         transition. Without this the dock would cancel the animation on the
         exact click that asks for it. Entering by choice animates; being sent
         straight to docked does not. */
      skipIntroAnimation: bypassed && !entered,
      muted,
    };
  }, [slugFromPath, lastPlayedSlug, introSeen, entered, dockActive, hydrated, muted]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}
