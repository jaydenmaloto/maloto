"use client";

import { LayoutGroup, MotionConfig } from "framer-motion";
import { PlayerProvider } from "@/components/player/PlayerProvider";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    /* LayoutGroup stays outermost so the dock's platter and the grid cards
       share one layout scope — that shared scope is what lets a record fly
       from a card onto the deck.

       MotionConfig reducedMotion="user" closes a gap: every CSS animation on
       the site is gated behind Tailwind's motion-safe: prefix, but the
       Framer-driven ones (the disc flight, the fumble drop, the modal fade,
       and now the dock move) previously ignored the preference entirely. */
    <LayoutGroup>
      <MotionConfig reducedMotion="user">
        <PlayerProvider>{children}</PlayerProvider>
      </MotionConfig>
    </LayoutGroup>
  );
}
