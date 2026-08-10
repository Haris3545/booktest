import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = supabaseServer();

  const { data: scan, error: scanErr } = await supabase
    .from("scans")
    .select("*")
    .eq("id", id)
    .single();

  if (scanErr) {
    return NextResponse.json({ error: scanErr.message }, { status: 404 });
  }

  const { data: books, error: booksErr } = await supabase
    .from("books")
    .select("*")
    .eq("scan_id", id)
    .order("position_index");

  if (booksErr) {
    return NextResponse.json({ error: booksErr.message }, { status: 500 });
  }

  return NextResponse.json({ scan, books: books ?? [] });
}
