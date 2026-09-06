import Link from "next/link";
import type { CaseStudy } from "@/data/caseStudies";

/* The section renderer is carried over close to unchanged from the old
   CaseStudyDetail — the text / image / split shapes still describe the data
   well. What's gone is the hero, the gallery carousel and the modal-vs-page
   branching; the shell owns the header now, and there is no modal. */
export function CaseStudyContent({ caseStudy }: { caseStudy: CaseStudy }) {
  return (
    <article className="flex flex-col gap-10 pb-24">
      <div>
        <Link
          href="/"
          className="text-sm text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          ‹ All work
        </Link>
      </div>

      <p className="text-lg leading-8 text-muted">{caseStudy.subtitle}</p>

      {caseStudy.metrics.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-hairline py-7 sm:grid-cols-3">
          {caseStudy.metrics.map((metric) => (
            <div key={metric.label}>
              <dt className="text-xs leading-5 text-muted">{metric.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold tracking-tight">{metric.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {caseStudy.sections.map((section, i) => {
        if (section.type === "image") {
          /* Kept as a plain <img>: these are authored SVG placeholders with no
             intrinsic dimensions recorded in the data, and next/image needs
             width and height up front. Worth revisiting when real screenshots
             land, since those will be raster and worth optimising. */
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={section.src}
              alt={section.alt ?? ""}
              className="w-full rounded-xl border border-hairline"
            />
          );
        }

        if (section.type === "split") {
          return (
            <div key={i} className="grid gap-8 sm:grid-cols-2">
              {[
                { title: section.leftTitle, items: section.leftItems },
                { title: section.rightTitle, items: section.rightItems },
              ].map((column) => (
                <div key={column.title}>
                  <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted">
                    {column.title}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-2.5">
                    {column.items?.map((item, j) => (
                      <li key={j} className="border-l border-hairline pl-3 text-sm leading-6">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          );
        }

        return (
          <div key={i} className="flex flex-col gap-4">
            {section.heading && (
              <h2 className="text-lg font-semibold tracking-tight">{section.heading}</h2>
            )}
            {section.paragraphs?.map((p, j) => (
              <p key={j} className="text-base leading-7 text-muted">
                {p}
              </p>
            ))}
          </div>
        );
      })}
    </article>
  );
}
