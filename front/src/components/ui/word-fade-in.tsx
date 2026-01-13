import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "@/lib/utils";

interface WordFadeInProps {
  text: string;
  className?: string;
  delay?: number;
  variants?: Variants;
}

export function WordFadeIn({
  text,
  className,
  delay = 0,
  variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
}: WordFadeInProps) {
  const words = text.split(" ");

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: 0.1, delayChildren: delay }}
      className={cn("font-display text-center tracking-[-0.02em] drop-shadow-sm", className)}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={variants}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-block mx-1"
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  );
}

