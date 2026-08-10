import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { recommendBooks } from "@/lib/anthropic";

export async function POST(request: Request) {
  const body = await request.json();
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: catalog } = await supabase.from("books").select("*");

  let result;
  try {
    result = await recommendBooks(
      query,
      (catalog ?? []).map((b) => ({ title: b.title, author: b.author }))
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Recommendation failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  // Attach the actual catalog row (and therefore shelf id) to each match so
  // the client can deep-link straight to where the book lives.
  const fromLibrary = result.fromLibrary.map((s) => {
    const match = (catalog ?? []).find(
      (b) => b.title.toLowerCase() === s.title.toLowerCase()
    );
    return { ...s, bookId: match?.id ?? null, shelfId: match?.shelf_id ?? null };
  });

  return NextResponse.json({ fromLibrary });
}
