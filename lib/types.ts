export type Confidence = "high" | "low" | "manual";

export interface Location {
  id: string;
  name: string;
  created_at: string;
}

export interface Unit {
  id: string;
  location_id: string;
  name: string;
  created_at: string;
}

export interface Shelf {
  id: string;
  unit_id: string;
  shelf_number: number;
  latest_photo_url: string | null;
  created_at: string;
}

export interface Scan {
  id: string;
  shelf_id: string;
  image_url: string;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Book {
  id: string;
  scan_id: string;
  shelf_id: string;
  title: string;
  author: string | null;
  position_index: number;
  spine_crop_url: string | null;
  bounding_box: BoundingBox | null;
  confidence: Confidence;
  raw_ocr_text: string | null;
  open_library_id: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface LocationWithChildren extends Location {
  units: (Unit & { shelves: Shelf[] })[];
}

export interface BookWithLocation extends Book {
  shelf: Shelf & {
    unit: Unit & { location: Location };
  };
  scan: Scan;
}
