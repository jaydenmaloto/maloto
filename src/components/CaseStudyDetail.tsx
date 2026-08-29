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

      <div className="mx-auto mt-10 flex max-w-2xl flex-col gap-8 px-4">
        {caseStudy.sections.map((section, i) =>
          section.type === "text" ? (
            <div key={i} className="flex flex-col gap-4">
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="text-base leading-7 text-foreground/85">
                  {p}
                </p>
              ))}
            </div>
          ) : (
            <img
              key={i}
              src={section.src}
              alt={section.alt ?? ""}
              className="w-full rounded-xl border border-foreground/10"
            />
          ),
        )}
      </div>
    </div>
  );
}
