"use client";

import Link from "next/link";
import type { CaseStudy } from "@/data/caseStudies";
import { CaseStudyHero } from "@/components/CaseStudyHero";
import { useModalClose } from "@/components/Modal";

export function CaseStudyDetail({
  caseStudy,
  discLayoutId,
}: {
  caseStudy: CaseStudy;
  discLayoutId?: string;
}) {
  const closeModal = useModalClose();

  return (
    <div className="pb-28">
      <div className="px-4 pt-6">
        {closeModal ? (
          <button
            type="button"
            onClick={closeModal}
            className="text-sm text-foreground/60 active:opacity-70"
          >
            ‹ All work
          </button>
        ) : (
          <Link href="/" className="text-sm text-foreground/60 active:opacity-70">
            ‹ All work
          </Link>
        )}
      </div>

      <CaseStudyHero
        title={caseStudy.title}
        role={caseStudy.role}
        year={caseStudy.year}
        images={caseStudy.gallery}
        discLayoutId={discLayoutId}
      />

      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-12 px-4">
        <p className="text-lg leading-8 text-foreground/70">{caseStudy.subtitle}</p>

        {caseStudy.metrics.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-5 gap-y-6 border-y border-foreground/10 py-7 sm:grid-cols-3">
            {caseStudy.metrics.map((metric) => (
              <div key={metric.label}>
                <dt className="text-xs leading-5 text-foreground/50">{metric.label}</dt>
                <dd className="mt-0.5 text-lg font-semibold tracking-tight">{metric.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {caseStudy.sections.map((section, i) => {
          if (section.type === "image") {
            return (
              <img
                key={i}
                src={section.src}
                alt={section.alt ?? ""}
                className="w-full rounded-xl border border-foreground/10"
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
                    <h3 className="text-[11px] uppercase tracking-[0.18em] text-foreground/45">
                      {column.title}
                    </h3>
                    <ul className="mt-3 flex flex-col gap-2.5">
                      {column.items?.map((item, j) => (
                        <li
                          key={j}
                          className="border-l border-foreground/15 pl-3 text-sm leading-6 text-foreground/80"
                        >
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
                <p key={j} className="text-base leading-7 text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
