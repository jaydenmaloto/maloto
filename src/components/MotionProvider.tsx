"use client";

import { LayoutGroup } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LayoutGroup>{children}</LayoutGroup>;
}
