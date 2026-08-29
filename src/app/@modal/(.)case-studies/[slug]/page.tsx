import { notFound } from "next/navigation";
import { getCaseStudy } from "@/data/caseStudies";
import { CaseStudyDetail } from "@/components/CaseStudyDetail";
import { Modal } from "@/components/Modal";

export default async function InterceptedCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudy(slug);
  if (!caseStudy) notFound();

  return (
    <Modal>
      <CaseStudyDetail caseStudy={caseStudy} discLayoutId={`disc-${slug}`} />
    </Modal>
  );
}
