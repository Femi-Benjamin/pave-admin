import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AdminEntrySplashProps {
  children: React.ReactNode;
}

export function AdminEntrySplash({ children }: AdminEntrySplashProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsVisible(false), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#27244F] via-[#39339A] to-[#5149F2]"
          aria-label="Welcome to Pave Admin Hub"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <div className="flex items-center gap-5">
              <img
                src="/pave_logo.png"
                alt="PAVE"
                className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]"
              />
              <span className="font-display text-5xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl">
                PAVE
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-5 text-sm font-medium tracking-wide text-white/70 sm:text-base"
            >
              Welcome to Pave Admin Hub
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
