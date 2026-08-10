import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { recommendBooks } from "@/lib/anthropic";
import { bestOpenLibraryMatch } from "@/lib/openlibrary";

export async function POST(request: Request) {
  const body = await request.json();
  const query = typeof body?.query === "string" ? body.query.trim() : "";

  if (!query) {
    return NextResponse.json({ error: "query is required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data: catalog } = await supabase.from("books").select("title, author");

  let result;
  try {
    result = await recommendBooks(query, catalog ?? []);
  } catch (err) {
    return NextResponse.json(
      { error: `Recommendation failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  const suggestionsWithLinks = await Promise.all(
    result.suggestions.map(async (s) => {
      const match = await bestOpenLibraryMatch(s.title, s.author);
      return {
        ...s,
        coverUrl: match?.coverUrl ?? null,
        openLibraryUrl: match ? `https://openlibrary.org${match.key}` : null,
      };
    })
  );

  return NextResponse.json({
    fromLibrary: result.fromLibrary,
    suggestions: suggestionsWithLinks,
  });
}
