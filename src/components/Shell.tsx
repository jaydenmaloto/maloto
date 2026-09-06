"use client";

import { usePathname } from "next/navigation";
import { getCaseStudy } from "@/data/caseStudies";
import { Turntable } from "@/components/Turntable";
import { Timeline } from "@/components/Timeline";
import { CaseStudyContent } from "@/components/CaseStudyContent";

const CASE_STUDY_PREFIX = "/case-studies/";

const INTRO =
  "I work from the inside out: finding the behavior that matters, building the logic and infrastructure behind it, and turning that into experiences users trust and businesses can quickly build upon.";

function slugFromPathname(pathname: string) {
  if (!pathname.startsWith(CASE_STUDY_PREFIX)) return null;
  const rest = pathname.slice(CASE_STUDY_PREFIX.length);
  return rest.length > 0 && !rest.includes("/") ? rest : null;
}

/* The entire page lives here rather than in the route files, and the reason is
   worth stating: the timeline dots have to sit in the gutter of the rows they
   label, which means the rail and the list must be one component; and the
   turntable has to survive navigation so the record changes rather than the
   whole deck blinking. Those two together rule out putting the list in a
   route's children. The route files still exist and still define real URLs —
   they just render nothing. Because this is a client component rendered from
   the layout, Next still server-renders all of it, so every URL stays
   crawlable. */
export function Shell() {
  const pathname = usePathname();
  const selectedSlug = slugFromPathname(pathname);
  const selected = selectedSlug ? getCaseStudy(selectedSlug) ?? null : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-32">
      <header className="flex flex-col items-center pt-14 text-center">
        <Turntable disc={selected?.disc ?? null} className="w-full max-w-[390px]" />

        {selected ? (
          <>
            <h1 className="mt-10 text-2xl font-semibold tracking-tight">{selected.title}</h1>
            <p className="mt-1 text-sm text-muted">
              {selected.role} · {selected.company} · {selected.year}
            </p>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-2xl font-semibold tracking-tight">
              Design-blooded Product Leader
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">{INTRO}</p>
          </>
        )}
      </header>

      {/* Two different shapes, not one grid with an empty cell: browsing wants
          the timeline at a comfortable reading width, reading wants it demoted
          to a narrow rail with the study taking the room. */}
      {selected ? (
        <div className="mt-14 grid gap-10 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-14">
          <Timeline selectedSlug={selectedSlug} />
          <CaseStudyContent caseStudy={selected} />
        </div>
      ) : (
        <div className="mx-auto mt-14 max-w-2xl">
          <Timeline selectedSlug={null} />
        </div>
      )}
    </div>
  );
}
