import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = await request.json();
  const unitId = typeof body?.unitId === "string" ? body.unitId : "";
  const shelfNumber = Number(body?.shelfNumber);

  if (!unitId || !Number.isFinite(shelfNumber)) {
    return NextResponse.json(
      { error: "unitId and shelfNumber are required." },
      { status: 400 }
    );
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("shelves")
    .insert({ unit_id: unitId, shelf_number: shelfNumber })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ shelf: data });
}
