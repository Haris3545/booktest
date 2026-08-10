-- Bookshelf Scanner schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists pg_trgm;

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists shelves (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  shelf_number int not null,
  latest_photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists scans (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references shelves(id) on delete cascade,
  image_url text not null,
  image_width int,
  image_height int,
  created_at timestamptz not null default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid not null references scans(id) on delete cascade,
  shelf_id uuid not null references shelves(id) on delete cascade,
  title text not null,
  author text,
  position_index int not null default 0,
  spine_crop_url text,
  bounding_box jsonb, -- { x, y, w, h } as fractions (0-1) of the source image
  confidence text not null default 'low', -- 'high' | 'low' | 'manual'
  raw_ocr_text text,
  open_library_id text,
  cover_url text,
  created_at timestamptz not null default now()
);

create index if not exists books_title_trgm on books using gin (title gin_trgm_ops);
create index if not exists books_author_trgm on books using gin (author gin_trgm_ops);
create index if not exists books_shelf_id_idx on books (shelf_id);
create index if not exists books_scan_id_idx on books (scan_id);
create index if not exists shelves_unit_id_idx on shelves (unit_id);
create index if not exists units_location_id_idx on units (location_id);

-- Storage bucket for shelf photos + spine crops (create via Supabase dashboard or API):
--   bucket name: "shelf-photos", public: true
-- This app only ever writes to Supabase using the service role key from server-side
-- code, so Row Level Security can stay in its default (locked-down) state — no
-- policies are required for the app to function, and none should be relaxed to
-- allow anon/public writes.
