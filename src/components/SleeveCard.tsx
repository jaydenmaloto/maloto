"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { CaseStudy } from "@/data/caseStudies";

export function SleeveCard({ caseStudy }: { caseStudy: CaseStudy }) {
  const { slug, title, role, year, disc, sleeve } = caseStudy;

  return (
    <Link href={`/case-studies/${slug}`} className="group relative z-0 block hover:z-20">
      <div className="relative transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:-translate-y-1">
        {/* Vinyl disc — tucked behind the sleeve, pulled out to the right on hover */}
        <motion.div
          layoutId={`disc-${slug}`}
          className="absolute inset-x-[6%] top-[6%] z-0 aspect-square"
        >
          {/* pull-out: slides right with a short "grip" delay and mild overshoot */}
          <div className="h-full w-full transition-[transform,filter] delay-[60ms] duration-[650ms] [transition-timing-function:cubic-bezier(0.3,1.15,0.45,1)] [filter:drop-shadow(-4px_5px_10px_rgba(0,0,0,0.55))] motion-safe:group-hover:translate-x-[42%] motion-safe:group-hover:rotate-[14deg] motion-safe:group-hover:[filter:drop-shadow(-10px_14px_24px_rgba(0,0,0,0.65))]">
            {/* idle loop: eases out a touch more while hover is held */}
            <div className="h-full w-full motion-safe:group-hover:animate-[record-breathe_5.5s_ease-in-out_0.9s_infinite]">
              {/* idle loop: twists back and forth with holds — reading the label */}
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
        </motion.div>

        {/* Album sleeve — tilts and shifts left as the record is pulled */}
        <div className="relative z-10 aspect-square overflow-hidden rounded-[3px] ring-1 ring-white/10 shadow-[0_2px_3px_rgba(0,0,0,0.6),0_14px_30px_rgba(0,0,0,0.45)] transition-[transform,box-shadow] duration-[650ms] [transition-timing-function:cubic-bezier(0.3,1.15,0.45,1)] motion-safe:group-hover:-translate-x-[4%] motion-safe:group-hover:-rotate-[2.5deg] group-hover:shadow-[0_3px_5px_rgba(0,0,0,0.65),0_22px_44px_rgba(0,0,0,0.55)]">
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

      <div className="mt-4">
        <span className="block truncate text-sm font-medium sm:text-base">{title}</span>
        <span className="block text-xs text-foreground/60 sm:text-sm">
          {role} · {year}
        </span>
      </div>
    </Link>
  );
}
