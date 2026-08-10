"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import type { Book, Location, Scan, Shelf, Unit } from "@/lib/types";

type Tab = "library" | "suggest";

interface SearchResult {
  book: Book;
  shelf: Shelf | null;
  unit: Unit | null;
  location: Location | null;
  scan: Scan | null;
}

interface Suggestion {
  title: string;
  author: string;
  reason: string;
  bookId?: string | null;
  shelfId?: string | null;
}

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [recommendation, setRecommendation] = useState<{
    fromLibrary: Suggestion[];
  } | null>(null);

  async function runLibrarySearch(q: string) {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.results ?? []);
    setLoading(false);
  }

  async function runRecommend(q: string) {
    setLoading(true);
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });
    const data = await res.json();
    setRecommendation(res.ok ? data : { fromLibrary: [] });
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    if (tab === "library") runLibrarySearch(query.trim());
    else runRecommend(query.trim());
  }

  return (
    <main className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-2xl font-bold mb-4">Find a book</h1>

      <div className="flex bg-surface border border-border rounded-2xl p-1 mb-5">
        {(["library", "suggest"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setResults(null);
              setRecommendation(null);
            }}
            className={cn(
              "flex-1 relative py-2.5 rounded-xl text-sm font-medium transition-colors",
              tab === t ? "text-accent-foreground" : "text-muted"
            )}
          >
            {tab === t && (
              <motion.div
                layoutId="search-tab"
                className="absolute inset-0 bg-accent rounded-xl -z-10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            {t === "library" ? "In my library" : "Suggest something"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            tab === "library"
              ? "Title or author…"
              : "e.g. a funny book about turtles"
          }
          className="w-full bg-surface border border-border rounded-2xl px-4 py-3.5 text-base"
        />
        <button type="submit" className="sr-only">
          Search
        </button>
      </form>

      {loading && <p className="text-muted text-center py-6">Looking…</p>}

      {tab === "library" && results && <LibraryResults results={results} />}
      {tab === "suggest" && recommendation && (
        <SuggestResults recommendation={recommendation} />
      )}
    </main>
  );
}

function LibraryResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return <p className="text-muted text-center py-6">No matches yet.</p>;
  }

  return (
    <div className="space-y-2">
      {results.map(({ book, shelf, unit, location }) => (
        <Link
          key={book.id}
          href={shelf ? `/shelf/${shelf.id}?book=${book.id}` : "#"}
          className="flex items-center gap-3 bg-surface border border-border rounded-2xl p-4"
        >
          {book.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.cover_url} alt="" className="w-10 h-14 object-cover rounded" />
          ) : (
            <div className="w-10 h-14 bg-background rounded flex items-center justify-center text-lg">
              📖
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">{book.title}</p>
            {book.author && <p className="text-sm text-muted truncate">{book.author}</p>}
            {location && unit && shelf && (
              <p className="text-sm text-accent mt-0.5">
                {location.name} · {unit.name} · Shelf {shelf.shelf_number}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}

function SuggestResults({
  recommendation,
}: {
  recommendation: { fromLibrary: Suggestion[] };
}) {
  const { fromLibrary } = recommendation;

  if (fromLibrary.length === 0) {
    return (
      <p className="text-muted text-center py-6">
        Nothing on your shelves fits that yet. Try rephrasing, or scan more books in.
      </p>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">
        From your shelves
      </h2>
      <div className="space-y-2">
        {fromLibrary.map((s) => {
          const content = (
            <>
              <p className="font-medium">{s.title}</p>
              <p className="text-sm text-muted mb-1">{s.author}</p>
              <p className="text-sm">{s.reason}</p>
            </>
          );
          return s.shelfId ? (
            <Link
              key={s.title}
              href={`/shelf/${s.shelfId}${s.bookId ? `?book=${s.bookId}` : ""}`}
              className="block bg-surface border border-accent/30 rounded-2xl p-4"
            >
              {content}
            </Link>
          ) : (
            <div key={s.title} className="bg-surface border border-accent/30 rounded-2xl p-4">
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}
