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
  coverUrl?: string | null;
  openLibraryUrl?: string | null;
}

export default function SearchPage() {
  const [tab, setTab] = useState<Tab>("library");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [recommendation, setRecommendation] = useState<{
    fromLibrary: Suggestion[];
    suggestions: Suggestion[];
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
    setRecommendation(res.ok ? data : { fromLibrary: [], suggestions: [] });
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
  recommendation: { fromLibrary: Suggestion[]; suggestions: Suggestion[] };
}) {
  const { fromLibrary, suggestions } = recommendation;

  if (fromLibrary.length === 0 && suggestions.length === 0) {
    return <p className="text-muted text-center py-6">No luck finding something. Try rephrasing.</p>;
  }

  return (
    <div className="space-y-8">
      {fromLibrary.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">
            Already on your shelf
          </h2>
          <div className="space-y-2">
            {fromLibrary.map((s) => (
              <div key={s.title} className="bg-surface border border-accent/30 rounded-2xl p-4">
                <p className="font-medium">{s.title}</p>
                <p className="text-sm text-muted mb-1">{s.author}</p>
                <p className="text-sm">{s.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
            You might like
          </h2>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.title} className="flex gap-3 bg-surface border border-border rounded-2xl p-4">
                {s.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.coverUrl} alt="" className="w-12 h-16 object-cover rounded shrink-0" />
                ) : (
                  <div className="w-12 h-16 bg-background rounded flex items-center justify-center text-xl shrink-0">
                    📖
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted mb-1">{s.author}</p>
                  <p className="text-sm mb-1">{s.reason}</p>
                  {s.openLibraryUrl && (
                    <a
                      href={s.openLibraryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent font-medium"
                    >
                      How to get it →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
