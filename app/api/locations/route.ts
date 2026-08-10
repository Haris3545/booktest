import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = supabaseServer();

  const [{ data: locations, error: locErr }, { data: units, error: unitErr }, { data: shelves, error: shelfErr }] =
    await Promise.all([
      supabase.from("locations").select("*").order("created_at"),
      supabase.from("units").select("*").order("created_at"),
      supabase.from("shelves").select("*").order("shelf_number"),
    ]);

  if (locErr || unitErr || shelfErr) {
    return NextResponse.json(
      { error: (locErr || unitErr || shelfErr)?.message },
      { status: 500 }
    );
  }

  const nested = (locations ?? []).map((location) => ({
    ...location,
    units: (units ?? [])
      .filter((u) => u.location_id === location.id)
      .map((unit) => ({
        ...unit,
        shelves: (shelves ?? []).filter((s) => s.unit_id === unit.id),
      })),
  }));

  return NextResponse.json({ locations: nested });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("locations")
    .insert({ name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ location: data });
}
