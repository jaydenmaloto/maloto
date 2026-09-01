import { caseStudies } from "@/data/caseStudies";
import { SleeveCard } from "@/components/SleeveCard";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 pb-24 pt-14">
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
