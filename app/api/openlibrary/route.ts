import { NextResponse } from "next/server";
import { searchOpenLibrary } from "@/lib/openlibrary";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (!q.trim()) {
    return NextResponse.json({ matches: [] });
  }

  const matches = await searchOpenLibrary(q, 8);
  return NextResponse.json({ matches });
}
