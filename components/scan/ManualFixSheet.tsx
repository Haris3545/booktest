"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { Book } from "@/lib/types";
import type { OpenLibraryMatch } from "@/lib/openlibrary";

export function ManualFixSheet({
  book,
  onResolved,
  onSkip,
}: {
  book: Book;
  onResolved: (updated: Book) => void;
  onSkip: () => void;
}) {
  const [query, setQuery] = useState(book.title);
  const [matches, setMatches] = useState<OpenLibraryMatch[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const handle = setTimeout(async () => {
      const res = await fetch(`/api/openlibrary?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      setMatches(data.matches ?? []);
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const visibleMatches = query.trim() ? matches : [];

  async function save(title: string, author: string | null, match?: OpenLibraryMatch) {
    setSaving(true);
    const res = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author,
        confidence: "manual",
        openLibraryId: match?.key ?? null,
        coverUrl: match?.coverUrl ?? null,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) onResolved(data.book);
  }

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      <div
        className="flex items-center justify-between px-5 py-4 border-b border-border"
        style={{ paddingTop: "calc(var(--safe-top) + 16px)" }}
      >
        <button onClick={onSkip} className="text-accent font-medium">
          Skip for now
        </button>
        <p className="font-semibold">Confirm this book</p>
        <div className="w-16" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        {book.spine_crop_url ? (
          <div className="rounded-2xl overflow-hidden border border-border mb-6 bg-black flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.spine_crop_url}
              alt="Book spine"
              className="max-h-72 w-auto object-contain"
            />
          </div>
        ) : (
          <p className="text-muted text-sm mb-6">
            Best guess so far: <span className="italic">&ldquo;{book.raw_ocr_text}&rdquo;</span>
          </p>
        )}

        <label className="text-sm font-medium text-muted mb-2 block">Title</label>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type the book title…"
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-base mb-4"
        />

        {visibleMatches.length > 0 && (
          <div className="space-y-2">
            {visibleMatches.map((m) => (
              <button
                key={m.key}
                onClick={() => save(m.title, m.author, m)}
                disabled={saving}
                className="w-full flex items-center gap-3 bg-surface border border-border rounded-2xl p-3 text-left"
              >
                {m.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.coverUrl} alt="" className="w-10 h-14 object-cover rounded" />
                ) : (
                  <div className="w-10 h-14 bg-background rounded flex items-center justify-center text-lg">
                    📖
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.title}</p>
                  {m.author && <p className="text-sm text-muted truncate">{m.author}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 border-t border-border">
        <Button
          size="lg"
          className="w-full"
          disabled={!query.trim() || saving}
          onClick={() => save(query.trim(), book.author)}
        >
          Save as &ldquo;{query.trim() || "…"}&rdquo;
        </Button>
      </div>
    </motion.div>
  );
}
