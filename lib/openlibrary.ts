export interface OpenLibraryMatch {
  key: string; // e.g. "/works/OL12345W"
  title: string;
  author: string | null;
  coverUrl: string | null;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
}

interface OpenLibrarySearchResponse {
  docs: OpenLibraryDoc[];
}

/**
 * Fuzzy-search Open Library for a title (works well even with partial/garbled
 * OCR text since Open Library's own search does fuzzy matching). Returns the
 * best guess or null if nothing reasonable came back.
 */
export async function searchOpenLibrary(
  query: string,
  limit = 5
): Promise<OpenLibraryMatch[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", trimmed);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("fields", "key,title,author_name,cover_i");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "bookshelf-scanner/1.0 (personal project)" },
  });

  if (!res.ok) return [];

  const data = (await res.json()) as OpenLibrarySearchResponse;

  return (data.docs ?? []).map((doc) => ({
    key: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
  }));
}

export async function bestOpenLibraryMatch(
  titleGuess: string,
  authorGuess?: string | null
): Promise<OpenLibraryMatch | null> {
  const query = authorGuess ? `${titleGuess} ${authorGuess}` : titleGuess;
  const matches = await searchOpenLibrary(query, 1);
  return matches[0] ?? null;
}
