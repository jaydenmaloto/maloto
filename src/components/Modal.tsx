"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const ModalCloseContext = createContext<(() => void) | null>(null);

export function useModalClose() {
  return useContext(ModalCloseContext);
}

export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  function close() {
    setIsOpen(false);
  }

  return (
    <ModalCloseContext.Provider value={close}>
      <AnimatePresence onExitComplete={() => router.back()}>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 overflow-y-auto bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </ModalCloseContext.Provider>
  );
}
