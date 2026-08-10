import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { ShelfPhotoView } from "@/components/shelf/ShelfPhotoView";
import { ConfidenceBadge } from "@/components/ui/ConfidenceBadge";
import type { Book, Scan, Shelf } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getShelf(id: string) {
  const supabase = supabaseServer();
  const { data: shelf } = await supabase.from("shelves").select("*").eq("id", id).single();
  if (!shelf) return null;

  const { data: books } = await supabase
    .from("books")
    .select("*")
    .eq("shelf_id", id)
    .order("position_index");

  let scan: Scan | null = null;
  if (books && books.length > 0) {
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("id", books[0].scan_id)
      .single();
    scan = data as Scan | null;
  }

  return { shelf: shelf as Shelf, books: (books ?? []) as Book[], scan };
}

export default async function ShelfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ book?: string }>;
}) {
  const { id } = await params;
  const { book: highlightBookId } = await searchParams;
  const data = await getShelf(id);

  if (!data) notFound();
  const { shelf, books, scan } = data;

  return (
    <main className="max-w-lg mx-auto px-5 pt-6">
      <h1 className="text-2xl font-bold mb-1">Shelf {shelf.shelf_number}</h1>
      <p className="text-muted mb-5">
        {books.length} book{books.length === 1 ? "" : "s"} catalogued
      </p>

      <ShelfPhotoView
        imageUrl={scan?.image_url ?? shelf.latest_photo_url}
        books={books}
        highlightBookId={highlightBookId}
      />

      <div className="mt-6 space-y-2">
        {books.map((book) => (
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
    </main>
  );
}
