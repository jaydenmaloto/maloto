import { notFound } from "next/navigation";
import { caseStudies, getCaseStudy } from "@/data/caseStudies";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  return { title: caseStudy ? `${caseStudy.title} — Jayden Maloto` : "Case study" };
}

/* Renders nothing on purpose — <Shell /> in the root layout reads the slug
   from the pathname and renders the study, so that the turntable and timeline
   survive navigation instead of remounting. This file still owns the route:
   its generateStaticParams prerenders every study, generateMetadata gives each
   one its title, and notFound() still guards unknown slugs. */
export default async function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getCaseStudy(slug)) notFound();
  return null;
}
