"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { getCaseStudy } from "@/data/caseStudies";
import { Turntable } from "@/components/Turntable";
import { Timeline } from "@/components/Timeline";
import { CaseStudyContent } from "@/components/CaseStudyContent";

const CASE_STUDY_PREFIX = "/case-studies/";

const INTRO =
  "I work from the inside out: finding the behavior that matters, building the logic and infrastructure behind it, and turning that into experiences users trust and businesses can quickly build upon.";

/* The fade duration lives in the literal class `duration-[260ms]` below, not
   in a constant interpolated into it: Tailwind scans source text statically,
   so a class built at runtime is never generated and the transition silently
   does not exist. Keep the two in step by hand. */

/* Scroll to the top, then run `done` once we are actually there.

   Next will not do this for us: <Link> defaults to maintaining scroll position
   and only moves when it can find a Page element that is out of view, and it
   explicitly skips elements "without rendered HTML" while looking. The route
   files here render null by design, so there is nothing for it to find. */
function scrollToTopThen(done: () => void) {
  /* Already there: navigate at once rather than making every repeat visit wait
     out an animation with nothing to animate. */
  if (window.scrollY <= 0) {
    done();
    return;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });

  /* The deadline is not belt-and-braces, it is the point: a smooth scroll is
     cancelled outright the moment the user touches a wheel or trackpad, and
     scrollend support is still uneven. Without it an interrupted scroll would
     strand the click having navigated nowhere. */
  const deadline = performance.now() + 700;
  const tick = () => {
    if (window.scrollY <= 0 || performance.now() > deadline) {
      done();
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

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
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedSlug = slugFromPathname(pathname);
  const selected = selectedSlug ? getCaseStudy(selectedSlug) ?? null : null;

  /* The fade is driven straight on the DOM rather than through state.

     Deriving a "leaving" flag from the pathname looks tidier but is wrong:
     the flag would still be set when the user presses Back, and the body
     would be stuck invisible. Writing opacity imperatively and restoring it
     on every pathname change is self-correcting — forward, back, or a URL
     typed in all land the same way — and it keeps setState out of an effect,
     which the React Compiler lint here forbids. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>("[data-fade]")) {
      el.style.opacity = "1";
    }
  }, [pathname]);

  const navigate = useCallback(
    (href: string) => {
      const root = rootRef.current;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const fading = !reduced && root ? [...root.querySelectorAll<HTMLElement>("[data-fade]")] : [];

      for (const el of fading) el.style.opacity = "0";

      /* If the push never resolves the effect above never runs, so restore
         opacity on a timer as well. Once the path has changed this is a no-op. */
      const restore = window.setTimeout(() => {
        for (const el of fading) el.style.opacity = "1";
      }, 1500);

      scrollToTopThen(() => {
        router.push(href);
        window.clearTimeout(restore);
        window.setTimeout(() => {
          for (const el of fading) el.style.opacity = "1";
        }, 1200);
      });
    },
    [router],
  );

  return (
    <div ref={rootRef} className="mx-auto w-full max-w-5xl px-6 pb-32">
      <header className="flex flex-col items-center pt-24 text-center">
        {/* The drawing's bounding box is centred to within a pixel, but it does
            not *look* centred: the bright platter sits at 42% of the width with
            dark empty plinth to its right, so the eye reads the visual mass as
            left of centre. This nudges it back optically.

            2.5% is settled from both directions: at 0 the drawing read left,
            and at 5% it read right — correcting far enough to truly centre the
            platter (7.85%) leaves the bounding box itself visibly right-heavy,
            so the comfortable value is well short of it. A percentage rather
            than pixels so it scales with the drawing on narrow screens. */}
        <Turntable
          disc={selected?.disc ?? null}
          className="w-full max-w-[360px] translate-x-[2.5%]"
        />

        {/* The heading fades with the body. The turntable deliberately does
            not: it is the one thing meant to persist across the change, and
            fading it would be the flicker this is trying to avoid. */}
        <div data-fade className="w-full transition-opacity duration-[260ms]">
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
            {/* max-w-md, not xl: the rail runs up the left margin beside this
                paragraph, and the gap between them is (2xl - this) / 2. At xl
                that left only 34px and the lead-in's + landed on the text. */}
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">{INTRO}</p>
          </>
        )}
        </div>
      </header>

      {/* The timeline is the browsing surface and nothing else: once you are
          reading a study it goes away entirely rather than lingering as a
          sidebar, so the study gets the full column and "‹ All work" is the
          single way back. Same width in both states, so the deck above stays
          over the same measure and nothing shifts on navigation. */}
      {/* Browsing pulls the rail up so the fader's + sits alongside the intro
          paragraph instead of starting in clear space below it. Only from md
          up — at 1440 the rail clears the intro text by ~36px, but on a narrow
          viewport both span the full column and would collide. A case study
          gets the normal offset: there is no rail to align to. */}
      <div
        data-fade
        className={`mx-auto max-w-2xl transition-opacity duration-[260ms] ${
          selected ? "mt-14" : "mt-14 md:-mt-20"
        }`}
      >
        {selected ? (
          <CaseStudyContent caseStudy={selected} onNavigate={navigate} />
        ) : (
          <Timeline onNavigate={navigate} />
        )}
      </div>
    </div>
  );
}
