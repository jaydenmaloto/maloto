"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePlayerState } from "@/components/player/PlayerProvider";

/* The dock's form below lg, modelled directly on the mini-bar in
   CaseStudyHero — same chrome, same safe-area handling, same spinning thumb —
   so the two read as one component that follows you around rather than two
   different bars.

   It renders only on "/", which is what keeps it from ever colliding with the
   hero's own mini-bar: while a case study is open the pathname is
   /case-studies/..., the hero's bar is the one on screen, and its tuned
   IntersectionObserver is left completely alone. */
export function DockMobileBar() {
  const pathname = usePathname();
  const { nowPlaying, nowPlayingSlug, phase } = usePlayerState();

  if (pathname !== "/") return null;
  if (phase !== "docked") return null;
  if (!nowPlaying || !nowPlayingSlug) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-foreground/10 bg-background/95 px-4 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link
        href={`/case-studies/${nowPlayingSlug}`}
        className="flex w-full items-center gap-3 py-2 text-left active:opacity-70"
        aria-label={`Back to ${nowPlaying.title}`}
      >
        <span className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black motion-safe:animate-[record-spin_3s_linear_infinite]">
          <img src={nowPlaying.disc} alt="" className="h-full w-full object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{nowPlaying.title}</span>
          <span className="block text-xs text-foreground/60">{nowPlaying.year}</span>
        </span>
      </Link>
    </div>
  );
}
