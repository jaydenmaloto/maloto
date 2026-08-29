"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { caseStudies } from "@/data/caseStudies";

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-16 pt-16">
      <h1 className="text-3xl font-semibold tracking-tight">Jayden Maloto</h1>
      <p className="mt-2 text-foreground/60">Selected work.</p>

      <ul className="mt-10 flex flex-col divide-y divide-foreground/10 border-y border-foreground/10">
        {caseStudies.map((caseStudy) => (
          <li key={caseStudy.slug}>
            <Link
              href={`/case-studies/${caseStudy.slug}`}
              className="flex min-h-16 items-center gap-4 py-4 active:bg-foreground/5"
            >
              <motion.span
                layoutId={`disc-${caseStudy.slug}`}
                className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-black"
              >
                <img
                  src={caseStudy.gallery[0]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </motion.span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-medium">{caseStudy.title}</span>
                <span className="block text-sm text-foreground/60">
                  {caseStudy.role} · {caseStudy.year}
                </span>
              </span>
              <span aria-hidden className="text-foreground/40">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
