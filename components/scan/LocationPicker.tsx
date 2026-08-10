"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import type { LocationWithChildren } from "@/lib/types";

const LAST_SHELF_KEY = "shelfie:last-shelf";

interface LastShelf {
  shelfId: string;
  locationName: string;
  unitName: string;
  shelfNumber: number;
}

export function LocationPicker({
  onSelect,
}: {
  onSelect: (shelfId: string, label: string) => void;
}) {
  const [locations, setLocations] = useState<LocationWithChildren[] | null>(null);
  const [lastShelf] = useState<LastShelf | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(LAST_SHELF_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [step, setStep] = useState<"quick" | "location" | "unit" | "shelf">("quick");
  const [selectedLocation, setSelectedLocation] = useState<LocationWithChildren | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<LocationWithChildren["units"][number] | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then((data) => setLocations(data.locations ?? []));
  }, []);

  function rememberAndSelect(shelfId: string, label: string, info: LastShelf) {
    localStorage.setItem(LAST_SHELF_KEY, JSON.stringify(info));
    onSelect(shelfId, label);
  }

  async function createLocation(name: string) {
    setBusy(true);
    const res = await fetch("/api/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setBusy(false);
    const newLoc: LocationWithChildren = { ...data.location, units: [] };
    setLocations((prev) => [...(prev ?? []), newLoc]);
    setSelectedLocation(newLoc);
    setStep("unit");
  }

  async function createUnit(name: string) {
    if (!selectedLocation) return;
    setBusy(true);
    const res = await fetch("/api/units", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: selectedLocation.id, name }),
    });
    const data = await res.json();
    setBusy(false);
    const newUnit = { ...data.unit, shelves: [] };
    setSelectedLocation((prev) =>
      prev ? { ...prev, units: [...prev.units, newUnit] } : prev
    );
    setSelectedUnit(newUnit);
    setStep("shelf");
  }

  async function createShelf(shelfNumber: number) {
    if (!selectedUnit || !selectedLocation) return;
    setBusy(true);
    const res = await fetch("/api/shelves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unitId: selectedUnit.id, shelfNumber }),
    });
    const data = await res.json();
    setBusy(false);
    const label = `${selectedLocation.name} · ${selectedUnit.name} · Shelf ${shelfNumber}`;
    rememberAndSelect(data.shelf.id, label, {
      shelfId: data.shelf.id,
      locationName: selectedLocation.name,
      unitName: selectedUnit.name,
      shelfNumber,
    });
  }

  if (locations === null) {
    return <div className="text-center text-muted py-10">Loading your library…</div>;
  }

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {step === "quick" && (
          <Step key="quick">
            <h2 className="text-xl font-semibold mb-4">Which shelf?</h2>

            {lastShelf && (
              <button
                onClick={() =>
                  rememberAndSelect(
                    lastShelf.shelfId,
                    `${lastShelf.locationName} · ${lastShelf.unitName} · Shelf ${lastShelf.shelfNumber}`,
                    lastShelf
                  )
                }
                className="w-full text-left bg-accent/10 border border-accent/30 rounded-2xl p-4 mb-4"
              >
                <p className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                  Continue where you left off
                </p>
                <p className="font-medium">
                  {lastShelf.locationName} · {lastShelf.unitName} · Shelf {lastShelf.shelfNumber}
                </p>
              </button>
            )}

            <div className="grid gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setSelectedLocation(loc);
                    setStep("location");
                  }}
                  className="w-full text-left bg-surface border border-border rounded-2xl p-4 font-medium"
                >
                  {loc.name}
                  <span className="block text-sm text-muted font-normal">
                    {loc.units.length} unit{loc.units.length === 1 ? "" : "s"}
                  </span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep("location")}
              className="w-full mt-3 text-center text-accent font-medium py-3"
            >
              + New location
            </button>
          </Step>
        )}

        {step === "location" && (
          <Step key="location">
            {selectedLocation ? (
              <ShelfSubStep
                title={`${selectedLocation.name} — pick a unit`}
                onBack={() => setStep("quick")}
              >
                <div className="grid gap-2">
                  {selectedLocation.units.map((unit) => (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setSelectedUnit(unit);
                        setStep("shelf");
                      }}
                      className="w-full text-left bg-surface border border-border rounded-2xl p-4 font-medium"
                    >
                      {unit.name}
                    </button>
                  ))}
                </div>
                <NewThingForm
                  placeholder="e.g. Bookcase 1"
                  busy={busy}
                  onSubmit={createUnit}
                  label="+ New unit"
                />
              </ShelfSubStep>
            ) : (
              <ShelfSubStep title="Name this location" onBack={() => setStep("quick")}>
                <NewThingForm
                  placeholder="e.g. Living Room"
                  busy={busy}
                  onSubmit={createLocation}
                  label="Create location"
                  autoShow
                />
              </ShelfSubStep>
            )}
          </Step>
        )}

        {step === "unit" && selectedLocation && (
          <Step key="unit">
            <ShelfSubStep title="Name this unit" onBack={() => setStep("quick")}>
              <NewThingForm
                placeholder="e.g. Bookcase 1"
                busy={busy}
                onSubmit={createUnit}
                label="Create unit"
                autoShow
              />
            </ShelfSubStep>
          </Step>
        )}

        {step === "shelf" && selectedUnit && selectedLocation && (
          <Step key="shelf">
            <ShelfSubStep
              title={`${selectedUnit.name} — pick a shelf`}
              onBack={() => setStep("location")}
            >
              <div className="grid grid-cols-3 gap-2 mb-4">
                {selectedUnit.shelves.map((shelf) => (
                  <button
                    key={shelf.id}
                    onClick={() =>
                      rememberAndSelect(
                        shelf.id,
                        `${selectedLocation.name} · ${selectedUnit.name} · Shelf ${shelf.shelf_number}`,
                        {
                          shelfId: shelf.id,
                          locationName: selectedLocation.name,
                          unitName: selectedUnit.name,
                          shelfNumber: shelf.shelf_number,
                        }
                      )
                    }
                    className="bg-surface border border-border rounded-2xl py-4 font-semibold"
                  >
                    {shelf.shelf_number}
                  </button>
                ))}
              </div>
              <NumberForm
                busy={busy}
                onSubmit={createShelf}
                defaultValue={selectedUnit.shelves.length + 1}
              />
            </ShelfSubStep>
          </Step>
        )}
      </AnimatePresence>
    </div>
  );
}

function Step({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
    >
      {children}
    </motion.div>
  );
}

function ShelfSubStep({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={onBack} className="text-accent font-medium">
          ‹ Back
        </button>
      </div>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function NewThingForm({
  placeholder,
  busy,
  onSubmit,
  label,
  autoShow,
}: {
  placeholder: string;
  busy: boolean;
  onSubmit: (value: string) => void;
  label: string;
  autoShow?: boolean;
}) {
  const [show, setShow] = useState(Boolean(autoShow));
  const [value, setValue] = useState("");

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full text-center text-accent font-medium py-3"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex gap-2 mt-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-base"
      />
      <Button
        disabled={!value.trim() || busy}
        onClick={() => onSubmit(value.trim())}
      >
        Add
      </Button>
    </div>
  );
}

function NumberForm({
  busy,
  onSubmit,
  defaultValue,
}: {
  busy: boolean;
  onSubmit: (value: number) => void;
  defaultValue: number;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="flex items-center gap-3">
      <p className="text-sm text-muted">New shelf number</p>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-20 bg-surface border border-border rounded-xl px-3 py-2 text-base"
      />
      <Button size="sm" disabled={busy} onClick={() => onSubmit(value)}>
        Add
      </Button>
    </div>
  );
}
