import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/data/caseStudies";
import { CaseStudyDetail } from "@/components/CaseStudyDetail";

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

  return <CaseStudyDetail caseStudy={caseStudy} />;
}
