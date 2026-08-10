"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";

export function HomeHero({ bookCount }: { bookCount: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <p className="text-muted text-sm font-medium">Your library</p>
      <h1 className="text-3xl font-bold tracking-tight mb-1">Shelfie</h1>
      <p className="text-muted mb-6">
        {bookCount > 0
          ? `${bookCount} book${bookCount === 1 ? "" : "s"} catalogued`
          : "Point, scan, and never lose a book again."}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link href="/scan">
          <Card
            interactive
            className="flex flex-col items-center justify-center text-center gap-2 h-32 bg-accent"
          >
            <span className="text-3xl">📷</span>
            <span className="font-semibold text-accent-foreground">Scan a shelf</span>
          </Card>
        </Link>
        <Link href="/search">
          <Card
            interactive
            className="flex flex-col items-center justify-center text-center gap-2 h-32"
          >
            <span className="text-3xl">🔍</span>
            <span className="font-semibold">Find a book</span>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}
