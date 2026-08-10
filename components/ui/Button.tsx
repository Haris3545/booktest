"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

const variantStyles: Record<Variant, string> = {
  primary: "bg-accent text-accent-foreground shadow-lg shadow-accent/25",
  secondary: "bg-surface text-foreground border border-border",
  ghost: "bg-transparent text-foreground",
  danger: "bg-danger text-white",
};

const sizeStyles: Record<Size, string> = {
  lg: "text-lg px-8 py-4 rounded-3xl min-h-[56px]",
  md: "text-base px-6 py-3 rounded-2xl min-h-[48px]",
  sm: "text-sm px-4 py-2 rounded-xl min-h-[40px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "font-medium select-none inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
