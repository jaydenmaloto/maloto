import { notFound } from "next/navigation";
import Link from "next/link";
import { caseStudies, getCaseStudy } from "@/data/caseStudies";
import { CaseStudyHero } from "@/components/CaseStudyHero";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  return { title: caseStudy ? `${caseStudy.title} — Jayden Maloto` : "Case study" };
}

export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) notFound();

  return (
    <div className="pb-28">
      <div className="px-4 pt-6">
        <Link href="/" className="text-sm text-foreground/60 active:opacity-70">
          ‹ All work
        </Link>
      </div>

      <CaseStudyHero
        title={caseStudy.title}
        role={caseStudy.role}
        year={caseStudy.year}
        images={caseStudy.gallery}
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
