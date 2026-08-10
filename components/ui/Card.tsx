"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

interface CardProps extends HTMLMotionProps<"div"> {
  interactive?: boolean;
}

export function Card({ interactive, className, children, ...props }: CardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: "spring", stiffness: 400, damping: 32 }}
      whileTap={interactive ? { scale: 0.97 } : undefined}
      className={cn(
        "bg-surface border border-border rounded-3xl p-5",
        interactive && "cursor-pointer active:bg-surface-raised",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
