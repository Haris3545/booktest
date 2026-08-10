import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseServer();

  const [{ data: shelf, error: shelfErr }, { data: books, error: booksErr }] =
    await Promise.all([
      supabase.from("shelves").select("*").eq("id", id).single(),
      supabase
        .from("books")
        .select("*")
        .eq("shelf_id", id)
        .order("position_index"),
    ]);

  if (shelfErr) {
    return NextResponse.json({ error: shelfErr.message }, { status: 404 });
  }
  if (booksErr) {
    return NextResponse.json({ error: booksErr.message }, { status: 500 });
  }

  let scan = null;
  if (books && books.length > 0) {
    const { data } = await supabase
      .from("scans")
      .select("*")
      .eq("id", books[0].scan_id)
      .single();
    scan = data;
  }

  return NextResponse.json({ shelf, books: books ?? [], scan });
}
