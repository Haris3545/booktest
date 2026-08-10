import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import type { Location, Unit, Shelf } from "@/lib/types";
import { HomeHero } from "@/components/home/HomeHero";
import { ShelfBrowser } from "@/components/home/ShelfBrowser";

export const dynamic = "force-dynamic";

async function getLibrary() {
  const supabase = supabaseServer();
  const [{ data: locations }, { data: units }, { data: shelves }, { count }] =
    await Promise.all([
      supabase.from("locations").select("*").order("created_at"),
      supabase.from("units").select("*").order("created_at"),
      supabase.from("shelves").select("*").order("shelf_number"),
      supabase.from("books").select("*", { count: "exact", head: true }),
    ]);

  const nested = ((locations ?? []) as Location[]).map((location) => ({
    ...location,
    units: ((units ?? []) as Unit[])
      .filter((u) => u.location_id === location.id)
      .map((unit) => ({
        ...unit,
        shelves: ((shelves ?? []) as Shelf[]).filter((s) => s.unit_id === unit.id),
      })),
  }));

  return { locations: nested, bookCount: count ?? 0 };
}

export default async function HomePage() {
  const { locations, bookCount } = await getLibrary();

  return (
    <main className="max-w-lg mx-auto px-5 pt-6">
      <HomeHero bookCount={bookCount} />

      {locations.length === 0 ? (
        <EmptyState />
      ) : (
        <ShelfBrowser locations={locations} />
      )}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 text-center">
      <div className="text-5xl mb-4">📚</div>
      <h2 className="text-xl font-semibold mb-2">No shelves yet</h2>
      <p className="text-muted mb-6">
        Scan your first bookshelf to start building your library map.
      </p>
      <Link
        href="/scan"
        className="inline-flex items-center justify-center bg-accent text-accent-foreground rounded-2xl px-6 py-3 font-medium"
      >
        Scan a shelf
      </Link>
    </div>
  );
}
