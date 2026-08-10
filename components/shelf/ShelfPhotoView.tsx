"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Book } from "@/lib/types";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";

export function ShelfPhotoView({
  imageUrl,
  books,
  highlightBookId,
}: {
  imageUrl: string | null;
  books: Book[];
  highlightBookId?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(highlightBookId ?? null);

  if (!imageUrl) {
    return (
      <div className="aspect-[4/3] rounded-3xl bg-surface border border-border flex items-center justify-center text-muted">
        No photo yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-3xl overflow-hidden border border-border bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Shelf photo" className="w-full h-auto block" />
        {books.map((book) => {
          if (!book.bounding_box) return null;
          const isActive = activeId === book.id;
          return (
            <motion.button
              key={book.id}
              onClick={() => setActiveId(isActive ? null : book.id)}
              className="absolute border-2 rounded-md"
              style={{
                left: `${book.bounding_box.x * 100}%`,
                top: `${book.bounding_box.y * 100}%`,
                width: `${book.bounding_box.w * 100}%`,
                height: `${book.bounding_box.h * 100}%`,
                borderColor: isActive ? "#0a84ff" : "transparent",
              }}
              animate={
                isActive
                  ? { boxShadow: "0 0 0 4px rgba(10,132,255,0.25)" }
                  : { boxShadow: "0 0 0 0 rgba(10,132,255,0)" }
              }
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          );
        })}
      </div>

      {activeId && (
        <ActiveBookCard book={books.find((b) => b.id === activeId)!} />
      )}
    </div>
  );
}

function ActiveBookCard({ book }: { book: Book }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{book.title}</p>
        {book.author && <p className="text-sm text-muted truncate">{book.author}</p>}
      </div>
      <ConfidenceBadge confidence={book.confidence} />
    </motion.div>
  );
}
