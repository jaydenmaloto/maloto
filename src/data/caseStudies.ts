export interface CaseStudySection {
  type: "text" | "image";
  paragraphs?: string[];
  src?: string;
  alt?: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  role: string;
  year: string;
  disc: string;
  sleeve?: string;
  gallery: string[];
  sections: CaseStudySection[];
}

const LOREM = [
  "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
  "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.",
  "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.",
  "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur.",
  "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.",
];

const GALLERY = [
  "/placeholders/disc.svg",
  "/placeholders/shot-1.svg",
  "/placeholders/shot-2.svg",
  "/placeholders/shot-3.svg",
];

function sections(): CaseStudySection[] {
  return [
    { type: "text", paragraphs: [LOREM[0], LOREM[1]] },
    { type: "image", src: "/placeholders/shot-1.svg", alt: "Placeholder screenshot" },
    { type: "text", paragraphs: [LOREM[2]] },
    { type: "image", src: "/placeholders/shot-2.svg", alt: "Placeholder screenshot" },
    { type: "text", paragraphs: [LOREM[3], LOREM[4]] },
  ];
}

export const caseStudies: CaseStudy[] = [
  {
    slug: "smartmatch",
    title: "SmartMatch",
    role: "Product Manager",
    year: "2024",
    disc: "/placeholders/record_smartmatch_final.png",
    sleeve: "/placeholders/sleeve_smartmatch_final.png",
    gallery: ["/placeholders/record_smartmatch_final.png", ...GALLERY.slice(1)],
    sections: sections(),
  },
  {
    slug: "operating-system",
    title: "CollegeAdvisor Operating System",
    role: "Product Manager",
    year: "2023",
    disc: "/placeholders/record_post-purchase_final.png",
    sleeve: "/placeholders/sleeve_post-purchase_final.png",
    gallery: ["/placeholders/record_post-purchase_final.png", ...GALLERY.slice(1)],
    sections: sections(),
  },
  {
    slug: "ai-toolsuite",
    title: "AI Advisor Toolsuite",
    role: "Product Manager",
    year: "2024",
    disc: "/placeholders/record_ai_toolsuite_final.png",
    sleeve: "/placeholders/sleeve_ai_toolsuite_final.png",
    gallery: ["/placeholders/record_ai_toolsuite_final.png", ...GALLERY.slice(1)],
    sections: sections(),
  },
  {
    slug: "anthm",
    title: "Anthm.live (iOS)",
    role: "Founder",
    year: "2025",
    disc: "/placeholders/record_anthm_final.png",
    sleeve: "/placeholders/sleeve_anthm_final.png",
    gallery: ["/placeholders/record_anthm_final.png", ...GALLERY.slice(1)],
    sections: sections(),
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
