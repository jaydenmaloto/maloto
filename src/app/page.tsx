"use client";

import { caseStudies } from "@/data/caseStudies";
import { SleeveCard } from "@/components/SleeveCard";
import { usePlayerState } from "@/components/player/PlayerProvider";

export default function Home() {
  const { phase } = usePlayerState();
  const isIntro = phase === "intro";

  return (
    /* The grid stays mounted through the intro rather than being conditionally
       rendered. Two reasons: it keeps the work in the server-rendered HTML so
       "/" stays crawlable, and — since the intro shell covers it with an
       opaque background anyway — hiding it with opacity rather than
       display:none leaves the cards with real measured boxes, which the record
       needs in order to fly out of one. */
    <div
      className={`mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-24 pt-14 transition-opacity duration-500 ${
        isIntro ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden={isIntro}
    >
      <h1 className="text-3xl font-semibold tracking-tight">Jayden Maloto</h1>
      <p className="mt-2 text-foreground/60">Selected work.</p>

      <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-14 sm:gap-x-8">
        {caseStudies.map((caseStudy) => (
          <SleeveCard key={caseStudy.slug} caseStudy={caseStudy} />
        ))}
      </div>
    </div>
  );
}
