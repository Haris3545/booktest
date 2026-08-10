"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const MESSAGES = [
  "Looking at your shelf…",
  "Reading spines, even the faded ones…",
  "Matching titles against the library catalog…",
  "Almost done…",
];

export function UploadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((i) => Math.min(i + 1, MESSAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-6 px-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
        className="w-14 h-14 rounded-full border-4 border-white/20 border-t-white"
      />
      <motion.p
        key={messageIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-white text-center font-medium"
      >
        {MESSAGES[messageIndex]}
      </motion.p>
    </div>
  );
}
