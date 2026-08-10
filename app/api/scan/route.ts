import { NextResponse } from "next/server";
import sharp from "sharp";
import { randomUUID } from "crypto";
import { supabaseServer, SHELF_PHOTOS_BUCKET } from "@/lib/supabase-server";
import { identifySpinesFromImage } from "@/lib/anthropic";
import { bestOpenLibraryMatch } from "@/lib/openlibrary";
import type { BoundingBox } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  const formData = await request.formData();
  const shelfId = formData.get("shelfId");
  const file = formData.get("image");

  if (typeof shelfId !== "string" || !shelfId) {
    return NextResponse.json({ error: "shelfId is required." }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "image file is required." }, { status: 400 });
  }

  const supabase = supabaseServer();
  const arrayBuffer = await file.arrayBuffer();
  const originalBuffer = Buffer.from(arrayBuffer);

  // Normalize to JPEG so downstream crops/uploads are predictable.
  const jpeg = sharp(originalBuffer).rotate(); // auto-orient from EXIF
  const normalizedBuffer = await jpeg.jpeg({ quality: 88 }).toBuffer();
  const metadata = await sharp(normalizedBuffer).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;

  const scanId = randomUUID();
  const photoPath = `scans/${scanId}.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from(SHELF_PHOTOS_BUCKET)
    .upload(photoPath, normalizedBuffer, { contentType: "image/jpeg", upsert: true });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage
    .from(SHELF_PHOTOS_BUCKET)
    .getPublicUrl(photoPath);
  const imageUrl = publicUrlData.publicUrl;

  let candidates;
  try {
    candidates = await identifySpinesFromImage(
      normalizedBuffer.toString("base64"),
      "image/jpeg"
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Vision analysis failed: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  if (candidates.length === 0) {
    return NextResponse.json(
      { error: "No book spines were detected in this photo. Try again with the shelf more centered and in focus." },
      { status: 422 }
    );
  }

  const { error: scanErr } = await supabase.from("scans").insert({
    id: scanId,
    shelf_id: shelfId,
    image_url: imageUrl,
    image_width: width,
    image_height: height,
  });

  if (scanErr) {
    return NextResponse.json({ error: scanErr.message }, { status: 500 });
  }

  const bookRows = await Promise.all(
    candidates.map(async (candidate, index) => {
      let title = candidate.title;
      let author = candidate.author;
      let openLibraryId: string | null = null;
      let coverUrl: string | null = null;

      if (candidate.confidence === "high") {
        const match = await bestOpenLibraryMatch(candidate.title, candidate.author);
        if (match) {
          title = match.title;
          author = match.author ?? author;
          openLibraryId = match.key;
          coverUrl = match.coverUrl;
        }
      }

      let spineCropUrl: string | null = null;
      if (candidate.confidence === "low" && width > 0 && height > 0) {
        spineCropUrl = await uploadSpineCrop(
          normalizedBuffer,
          width,
          height,
          candidate.box,
          `crops/${scanId}-${index}.jpg`
        );
      }

      return {
        scan_id: scanId,
        shelf_id: shelfId,
        title,
        author,
        position_index: index,
        spine_crop_url: spineCropUrl,
        bounding_box: candidate.box,
        confidence: candidate.confidence,
        raw_ocr_text: candidate.raw_text,
        open_library_id: openLibraryId,
        cover_url: coverUrl,
      };
    })
  );

  const { data: insertedBooks, error: booksErr } = await supabase
    .from("books")
    .insert(bookRows)
    .select();

  if (booksErr) {
    return NextResponse.json({ error: booksErr.message }, { status: 500 });
  }

  await supabase
    .from("shelves")
    .update({ latest_photo_url: imageUrl })
    .eq("id", shelfId);

  return NextResponse.json({ scanId, books: insertedBooks });
}

async function uploadSpineCrop(
  sourceBuffer: Buffer,
  width: number,
  height: number,
  box: BoundingBox,
  path: string
): Promise<string | null> {
  try {
    const left = Math.max(0, Math.round(box.x * width));
    const top = Math.max(0, Math.round(box.y * height));
    const cropWidth = Math.max(1, Math.min(width - left, Math.round(box.w * width)));
    const cropHeight = Math.max(1, Math.min(height - top, Math.round(box.h * height)));

    const cropped = await sharp(sourceBuffer)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .jpeg({ quality: 90 })
      .toBuffer();

    const supabase = supabaseServer();
    const { error } = await supabase.storage
      .from(SHELF_PHOTOS_BUCKET)
      .upload(path, cropped, { contentType: "image/jpeg", upsert: true });

    if (error) return null;

    const { data } = supabase.storage.from(SHELF_PHOTOS_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  } catch {
    return null;
  }
}
