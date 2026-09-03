export interface CaseStudyMetric {
  label: string;
  value: string;
}

export interface CaseStudySection {
  type: "text" | "image" | "split";
  heading?: string;
  paragraphs?: string[];
  src?: string;
  alt?: string;
  /* split: two labelled columns, used for before/after and
     experience/system framings */
  leftTitle?: string;
  rightTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
}

export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  company: string;
  year: string;
  disc: string;
  sleeve?: string;
  gallery: string[];
  metrics: CaseStudyMetric[];
  sections: CaseStudySection[];
}

const GALLERY = [
  "/placeholders/disc.svg",
  "/placeholders/shot-1.svg",
  "/placeholders/shot-2.svg",
  "/placeholders/shot-3.svg",
];

export const caseStudies: CaseStudy[] = [
  {
    slug: "smartmatch",
    title: "SmartMatch",
    subtitle:
      "Turning a broken matching process into a faster, more trustworthy onboarding experience that strengthened conversion and revenue.",
    role: "Director of Product",
    company: "CollegeAdvisor.com",
    year: "2023 – 2025",
    disc: "/placeholders/record_smartmatch_final.png",
    sleeve: "/placeholders/sleeve_smartmatch_final.png",
    gallery: ["/placeholders/record_smartmatch_final.png", ...GALLERY.slice(1)],
    metrics: [
      { label: "Annual cancellation rate", value: "11% → 3%" },
      { label: "Increase in close percentage", value: "+25%" },
      { label: "Revenue per sales meeting", value: "+43%" },
      { label: "Faster to first meeting booked", value: "7 days" },
      { label: "Faster to first meeting held", value: "5.5 days" },
      { label: "Annual revenue YoY", value: "+15%" },
    ],
    sections: [
      {
        type: "text",
        heading: "The Problem",
        paragraphs: [
          "Before SmartMatch, families who paid thousands of dollars for an advising package filled out an intake form and then waited, sometimes days, for the operations team to manually match them with an advisor. For a high-cost, high-trust service, the enrollment experience offered too little visibility, too little agency, and no immediate sense of who the family would actually work with.",
          "The result was friction at exactly the wrong moment. Cancellations were common, onboarding moved slowly, and the business was losing revenue in a part of the journey that should have been building confidence.",
        ],
      },
      {
        type: "text",
        heading: "The Insight",
        paragraphs: [
          "The issue was not just matching quality. It was timing.",
          "Matching had more value as a conversion lever than as a hidden post-purchase workflow. The opportunity was to make advisor fit visible earlier, at the moment families were deciding whether to move forward.",
        ],
      },
      {
        type: "text",
        heading: "What Changed",
        paragraphs: [
          "SmartMatch moved matching inside the sales funnel through an intuitive matching form and advisor selection experience. That shift changed the opening moments of the client journey.",
          "On the front end, families got a clearer sense of fit before purchase. Behind the scenes, the system structured advisor availability, capacity, and matching criteria more intentionally. The result was a clearer decision experience for families and a stronger operating model for the business.",
        ],
      },
      {
        type: "split",
        leftTitle: "In the experience",
        rightTitle: "In the system",
        leftItems: [
          "High-visibility advisor matching surfaced before purchase",
          "Instant confirmation emails launched families directly into orientation scheduling",
        ],
        rightItems: [
          "More structured matching logic accounting for roster capacity and advisor preferences, including time zone, package, and grad year",
          "Less reliance on manual coordination",
        ],
      },
      {
        type: "text",
        heading: "What I Led",
        paragraphs: [
          "I led the product framing, experience strategy, and cross-functional development of SmartMatch.",
          "That included reframing matching as a conversion problem, shaping the journey, translating operational complexity into product logic, and aligning engineering, sales, and operations around rollout.",
        ],
      },
      {
        type: "text",
        heading: "Results",
        paragraphs: [
          "SmartMatch improved both the customer decision experience and the system behind it.",
          "Annual cancellations dropped from 11% to 3%. Families booked their first meeting 7 days faster, and first meetings took place 5.5 days faster. Close percentage increased by 25%, annual revenue grew 15% year over year, and revenue per sales meeting rose 43%.",
        ],
      },
      {
        type: "text",
        heading: "What I'd Do Differently",
        paragraphs: [
          "Although the issue was manageable, I would have modeled advisor availability constraints more tightly from the start. In a two-sided marketplace, too much flexibility on the advisor side can quietly reduce options for the client side.",
        ],
      },
    ],
  },
  {
    slug: "operating-system",
    title: "CollegeAdvisor Operating System",
    subtitle:
      "Turning a fragmented advising service into a centralized operating system that made delivery more visible, measurable, and scalable.",
    role: "Product Lead",
    company: "CollegeAdvisor.com",
    year: "2021 – Present",
    disc: "/placeholders/record_post-purchase_final.png",
    sleeve: "/placeholders/sleeve_post-purchase_final.png",
    gallery: ["/placeholders/record_post-purchase_final.png", ...GALLERY.slice(1)],
    metrics: [
      { label: "Student profiles structured", value: "10,000+" },
      { label: "Application outcomes captured", value: "40,000+" },
      { label: "Annual feedback signals", value: "300+" },
      { label: "Trustpilot rating", value: "4.9 ★" },
      { label: "Trustpilot reviews", value: "1,000+" },
    ],
    sections: [
      {
        type: "text",
        heading: "The Problem",
        paragraphs: [
          "College advising was delivered as a high-touch service, but the work behind it was fragmented. Student progress, advisor notes, account context, service usage, and application outcomes lived across spreadsheets, Airtable, Stripe workflows, and disconnected manual processes.",
          "That made it harder to manage service quality, identify at-risk families early, capture feedback consistently, and understand what was actually happening across the student journey. The business was delivering real value, but much of that value was operationally invisible and difficult to scale.",
        ],
      },
      {
        type: "text",
        heading: "The Insight",
        paragraphs: [
          "The problem was not just tool fragmentation. It was missing product infrastructure.",
          "The advising business needed a system that could capture the behaviors that actually shaped service quality: student progress, advisor activity, relationship health, service usage, and outcomes over time. If those signals could be structured inside the product, they could improve daily execution, support retention, and create long-term leverage across reporting, marketing, feedback, and future AI.",
        ],
      },
      {
        type: "text",
        heading: "What Changed",
        paragraphs: [
          "We brought the core service layer into the product.",
          "Instead of critical advising workflows living across disconnected tools, the platform became the central place to manage student records, shared notes, support context, scheduling, milestone progress, service usage, and outcomes data. That shifted the product from supporting the service at the edges to becoming the operating layer the service could actually run on.",
        ],
      },
      {
        type: "split",
        leftTitle: "In the experience",
        rightTitle: "In the system",
        leftItems: [
          "First-party meeting scheduling so families can book sessions inside the platform while advisors manage availability in-system",
          "Shared notes, support tickets, and account tracking giving sales, admin, and advisors a common view of student progress, account status, and open issues",
          "Application tracking and end-of-journey surveys creating stronger feedback loops around outcomes and experience quality",
        ],
        rightItems: [
          "Time tracking infrastructure connecting student milestones, package entitlements, and advisor payment logic",
          "Outcomes capture creating a stronger first-party data foundation for reporting, retention, and future AI tools",
        ],
      },
      {
        type: "text",
        heading: "What I Led",
        paragraphs: [
          "I led the product framing, prioritization, and design direction behind this shift.",
          "That included identifying which parts of the advising journey needed to become structured product behavior, translating messy service workflows into usable product logic, and aligning engineering, operations, and leadership around the highest-leverage platform investments. My role was not just to digitize process, but to help define the operating layer the business could run on.",
        ],
      },
      {
        type: "text",
        heading: "Results",
        paragraphs: [
          "This work created a centralized product foundation across 10,000+ student profiles and 40,000+ application outcomes. It made service delivery more visible, improved internal consistency, and gave the business a stronger system for monitoring engagement, supporting retention, and learning from outcomes over time.",
          "It also created tighter feedback loops through shared support infrastructure, application tracking, end-of-journey surveys, and 300+ support and product feedback signals captured annually. That gave teams a clearer way to identify issues, improve the experience, and sustain a 4.9 Trustpilot rating across 1,000+ reviews. Just as importantly, it built a first-party data foundation that could support stronger reporting, outcome storytelling, marketing proof points, and future AI tools.",
        ],
      },
      {
        type: "text",
        heading: "What I'd Do Differently",
        paragraphs: [
          "I would define the core health model earlier.",
          "As the system expanded, we captured more and more of the advising journey: meetings, notes, milestones, support issues, surveys, and outcomes. That created a strong operating foundation, but I would spend more time upfront identifying which signals were most predictive of student momentum, service risk, and renewal likelihood so the system could drive intervention more proactively, not just visibility.",
        ],
      },
    ],
  },
  {
    slug: "ai-toolsuite",
    title: "AI Advisor Toolsuite",
    subtitle:
      "Using AI to turn scattered knowledge into advisor tools that improved speed, consistency, and service quality.",
    role: "Product Lead",
    company: "CollegeAdvisor.com",
    year: "2024 – 2025",
    disc: "/placeholders/record_ai_toolsuite_final.png",
    sleeve: "/placeholders/sleeve_ai_toolsuite_final.png",
    gallery: ["/placeholders/record_ai_toolsuite_final.png", ...GALLERY.slice(1)],
    metrics: [
      { label: "Time saved per essay", value: "5–10 min" },
      { label: "Offline research time", value: "↓ 14.8%" },
      { label: "Advisor-to-advisor consultations", value: "↓ 26.6%" },
      { label: "Essay review cost per student", value: "↓ 12%" },
      { label: "Annualized efficiency impact", value: "~6-figure" },
    ],
    sections: [
      {
        type: "text",
        heading: "The Problem",
        paragraphs: [
          "CollegeAdvisor's service depended on human expertise, but that expertise was hard to access in the moment it was needed. Advisors searched across webinars, blog content, internal guidance, editorial resources, and colleague knowledge to answer questions and support students. As the business grew, that made answers slower, workflows less consistent, and quality harder to scale.",
          "Essay reviews had a similar problem. Advisors were delivering thoughtful feedback, but the process was time-intensive and uneven from one reviewer to the next. The issue was not whether expert feedback mattered. It was that too much of that value depended on manual effort.",
        ],
      },
      {
        type: "text",
        heading: "The Insight",
        paragraphs: [
          "The best early use of AI was not to automate the student experience. It was to support the experts already delivering it.",
          "That gave us lower-risk, higher-signal use cases. If AI could help advisors access trusted knowledge faster and handle first-pass review more efficiently, we could improve service quality while learning where AI was genuinely useful.",
        ],
      },
      {
        type: "text",
        heading: "What Changed",
        paragraphs: [
          "The core product move was turning AI from a broad idea into a focused internal toolsuite built around two high-friction advisor workflows: knowledge access and feedback workflows. Instead of treating AI as a standalone feature, we applied it where expert work was slow, repetitive, and hard to scale, making trusted guidance easier to retrieve and more consistent to deliver.",
          "In knowledge access, I helped shape an internal advisor chatbot grounded in proprietary CollegeAdvisor materials, U.S. News editorial content, TeenLife extracurricular data, and internal process knowledge. It gave advisors and specialists faster access to trusted answers without relying as heavily on manual searching or backchannel consultations.",
          "In essay review and editing flows, I helped shape an AI essay review workflow built from real advisor expertise and custom rubrics. Early versions leaned too heavily on open-ended summaries, so we pushed the product toward more structured, criteria-based outputs with clearer flags and more actionable guidance. That made the tool more useful as a first-pass review assistant rather than a vague writing commentator.",
        ],
      },
      {
        type: "split",
        leftTitle: "In knowledge access",
        rightTitle: "In the essay workflow",
        leftItems: [
          "Internal advisor chatbot grounded in CollegeAdvisor, U.S. News, and TeenLife sources",
          "Faster access to trusted answers without manual searching or backchannel consultations",
        ],
        rightItems: [
          "Structured, criteria-based feedback replacing open-ended summaries",
          "Clearer flags and actionable guidance designed for first-pass review",
        ],
      },
      {
        type: "text",
        heading: "What I Led",
        paragraphs: [
          "I helped identify the advisor workflows where AI had the clearest product value and lowest trust risk. I shaped the direction around internal augmentation rather than premature customer-facing automation, defined the core use cases, and translated advisor behavior into tool requirements that fit day-to-day work.",
          "I also helped drive iteration based on advisor feedback, especially around output quality and usability. A key product decision was focusing less on whether the AI could generate a response and more on whether the response was structured in a way advisors could actually use.",
        ],
      },
      {
        type: "text",
        heading: "Results",
        paragraphs: [
          "Across the broader toolsuite, faster access to trusted answers reduced reliance on manual searching and backchannel support. Offline research time logs declined by 14.8%, and advisor-to-advisor consultation time logs declined by 26.6%, together driving roughly a 15% reduction in research and consultation overhead. Those shifts improved efficiency in the workflows where expert knowledge had previously been hardest to access in the moment.",
          "The clearest proof point within feedback workflows came from essay review. Most advisors reported saving roughly 5 to 10 minutes per essay, making the tool useful as a faster first-pass workflow without removing human judgment. That efficiency also showed up in the economics of the workflow: average essay review cost per student declined by roughly 12%. Advisor feedback also improved the product itself, helping shift outputs from open-ended summaries to more structured, actionable guidance.",
          "Taken together, the tools drove a material six-figure annualized efficiency impact across research, consultation, and essay review workflows, while establishing a practical, lower-risk model for introducing AI in a high-trust service business.",
        ],
      },
      {
        type: "text",
        heading: "What I'd Do Differently",
        paragraphs: [
          "I would have pushed earlier for feedback that was more actionable and more relative to real advisor expectations. Early outputs were easier to generate than to use: they summarized issues, but did not always help advisors understand how strong a draft was, what mattered most, or what to do next.",
          "The product became much more useful once we moved from simple categorized summaries to a more rubric-based approach grounded in collective advisor expertise across different schools and writing standards. That shift made the feedback easier to trust, easier to act on, and ultimately more likely to be adopted.",
        ],
      },
    ],
  },
  {
    slug: "anthm",
    title: "Anthm.live (iOS)",
    subtitle: "Building the infrastructure for fan identity through live music.",
    role: "Founder / Product Lead",
    company: "Anthm",
    year: "2025 – Present",
    disc: "/placeholders/record_anthm_final.png",
    sleeve: "/placeholders/sleeve_anthm_final.png",
    gallery: ["/placeholders/record_anthm_final.png", ...GALLERY.slice(1)],
    metrics: [
      { label: "MVP shipped", value: "December" },
      { label: "iOS launch", value: "App Store" },
    ],
    sections: [
      {
        type: "text",
        heading: "The Problem",
        paragraphs: [
          "Music fans already keep track of the shows they go to, but it's messy and personal. It lives in Notes apps, screenshots, group chats, and memory, not in any real product.",
          "I noticed this firsthand through my own experience in the electronic music scene, where people constantly reference past shows, rank them, and tie them to specific moments in their lives. But there was no shared place to actually do that.",
          "Streaming platforms show what you listen to. Ticketing platforms show what you bought. Neither captures what the experience actually meant.",
        ],
      },
      {
        type: "text",
        heading: "The Insight",
        paragraphs: [
          "People were already treating concerts like data in their heads: remembering sets, comparing experiences, ranking artists, revisiting venues. The gap wasn't interest. It was structure.",
          "What was missing was a simple system that could let people log shows consistently, make those experiences easy to compare over time, and turn personal memory into something they could look back on or share.",
        ],
      },
      {
        type: "split",
        leftTitle: "Before",
        rightTitle: "After",
        leftItems: [
          "Show memories scattered across Notes apps, screenshots, and group chats",
          "No structured way to rank or compare experiences over time",
          "Streaming history disconnected from live attendance",
          "No shared place to revisit or express what shows actually meant",
        ],
        rightItems: [
          "Concerts and festival sets logged with artist and venue context",
          "Ranking system that turns experiences into a comparable record",
          "Spotify tracks linked to specific moments in each entry",
          "iOS app in the App Store with lightweight sharing",
        ],
      },
      {
        type: "text",
        heading: "What I Led",
        paragraphs: [
          "I led Anthm.live from idea to launch, defining the core use case, shaping the MVP, and directing UX end-to-end.",
          "I decided what the product actually was (a live music memory system, not just a tracker), what data mattered (shows, artists, venues, songs), and which behaviors to support first (logging, ranking, revisiting, sharing).",
          "I built and shipped an MVP where users could log concerts and festival sets, attach artist and venue context, rank experiences, and link Spotify tracks to specific moments. I brought it to iOS and iterated based on early usage. That made it clear the value wasn't logging, it was memory and ranking, and that mobile plus quick sharing were essential.",
          "I also worked through how to bring in external data from Spotify and Ticketmaster so entries felt grounded without adding friction.",
        ],
      },
      {
        type: "text",
        heading: "Why It Matters",
        paragraphs: [
          "Anthm.live reflects how I approach product work: start with a behavior people already have, figure out what's missing, and build the structure that supports it.",
          "Here the behavior was simple: people using live music as part of their identity, and the product is an attempt to make that behavior easier to capture and actually use over time.",
        ],
      },
    ],
  },
];

export function getCaseStudy(slug: string) {
  return caseStudies.find((c) => c.slug === slug);
}
