"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import { ManualFixSheet } from "@/components/scan/ManualFixSheet";
import type { Book, Scan } from "@/lib/types";

function ReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scanId = searchParams.get("scanId");

  const [scan, setScan] = useState<Scan | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    if (!scanId) return;
    fetch(`/api/scans/${scanId}`)
      .then((r) => r.json())
      .then((data) => {
        setScan(data.scan);
        setBooks(data.books ?? []);
      });
  }, [scanId]);

  const needsReview = useMemo(
    () => (books ?? []).filter((b) => b.confidence === "low"),
    [books]
  );
  const confirmed = useMemo(
    () => (books ?? []).filter((b) => b.confidence !== "low"),
    [books]
  );

  function updateBook(updated: Book) {
    setBooks((prev) => (prev ?? []).map((b) => (b.id === updated.id ? updated : b)));
    setReviewingId(null);
  }

  if (!scanId) {
    return (
      <main className="max-w-lg mx-auto px-5 pt-10 text-center text-muted">
        No scan to review.
      </main>
    );
  }

  if (books === null) {
    return (
      <main className="max-w-lg mx-auto px-5 pt-10 text-center text-muted">
        Loading results…
      </main>
    );
  }

  const reviewingBook = books.find((b) => b.id === reviewingId) ?? null;

  return (
    <main className="max-w-lg mx-auto px-5 pt-6 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold mb-1">
          Found {books.length} book{books.length === 1 ? "" : "s"}
        </h1>
        <p className="text-muted mb-6">
          {needsReview.length > 0
            ? `${needsReview.length} need${needsReview.length === 1 ? "s" : ""} a quick check`
            : "Everything looks good."}
        </p>
      </motion.div>

      {needsReview.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">
            Needs a quick check
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {needsReview.map((book) => (
                <motion.button
                  key={book.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -30 }}
                  onClick={() => setReviewingId(book.id)}
                  className="w-full flex items-center gap-3 bg-surface border border-warning/30 rounded-2xl p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{book.title}</p>
                    <p className="text-sm text-muted truncate">Tap to confirm</p>
                  </div>
                  <ConfidenceBadge confidence={book.confidence} />
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      {confirmed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            Looking good
          </h2>
          <div className="space-y-2">
            {confirmed.map((book) => (
              <div
                key={book.id}
                className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{book.title}</p>
                  {book.author && <p className="text-sm text-muted truncate">{book.author}</p>}
                </div>
                <ConfidenceBadge confidence={book.confidence} />
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8">
        <Button
          size="lg"
          className="w-full"
          onClick={() => router.push(scan ? `/shelf/${scan.shelf_id}` : "/")}
        >
          Done
        </Button>
      </div>

      <AnimatePresence>
        {reviewingBook && (
          <ManualFixSheet
            book={reviewingBook}
            onResolved={updateBook}
            onSkip={() => setReviewingId(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={null}>
      <ReviewContent />
    </Suspense>
  );
}
