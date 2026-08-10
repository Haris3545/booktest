import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const supabase = supabaseServer();
  const { data: books, error } = await supabase
    .from("books")
    .select("*")
    .or(`title.ilike.%${q}%,author.ilike.%${q}%`)
    .limit(25);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!books || books.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const shelfIds = [...new Set(books.map((b) => b.shelf_id))];
  const scanIds = [...new Set(books.map((b) => b.scan_id))];

  const [{ data: shelves }, { data: scans }] = await Promise.all([
    supabase.from("shelves").select("*").in("id", shelfIds),
    supabase.from("scans").select("*").in("id", scanIds),
  ]);

  const unitIds = [...new Set((shelves ?? []).map((s) => s.unit_id))];
  const { data: units } = await supabase.from("units").select("*").in("id", unitIds);

  const locationIds = [...new Set((units ?? []).map((u) => u.location_id))];
  const { data: locations } = await supabase
    .from("locations")
    .select("*")
    .in("id", locationIds);

  const results = books.map((book) => {
    const shelf = shelves?.find((s) => s.id === book.shelf_id) ?? null;
    const unit = shelf ? units?.find((u) => u.id === shelf.unit_id) ?? null : null;
    const location = unit ? locations?.find((l) => l.id === unit.location_id) ?? null : null;
    const scan = scans?.find((s) => s.id === book.scan_id) ?? null;

    return { book, shelf, unit, location, scan };
  });

  return NextResponse.json({ results });
}
