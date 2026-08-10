import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json();
  const locationId = typeof body?.locationId === "string" ? body.locationId : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!locationId || !name) {
    return NextResponse.json(
      { error: "locationId and name are required." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("units")
    .insert({ location_id: locationId, name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ unit: data });
}
