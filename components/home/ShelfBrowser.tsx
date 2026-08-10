"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import type { Location, Unit, Shelf } from "@/lib/types";

type LocationNode = Location & { units: (Unit & { shelves: Shelf[] })[] };

export function ShelfBrowser({ locations }: { locations: LocationNode[] }) {
  const [openId, setOpenId] = useState<string | null>(locations[0]?.id ?? null);

  return (
    <div className="space-y-3 mb-10">
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide px-1">
        Your shelves
      </h2>
      {locations.map((location) => {
        const isOpen = openId === location.id;
        const shelfCount = location.units.reduce((n, u) => n + u.shelves.length, 0);

        return (
          <Card key={location.id} className="p-0 overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : location.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <div>
                <p className="font-semibold">{location.name}</p>
                <p className="text-sm text-muted">
                  {location.units.length} unit{location.units.length === 1 ? "" : "s"} ·{" "}
                  {shelfCount} shelf{shelfCount === 1 ? "" : "ves"}
                </p>
              </div>
              <motion.span
                animate={{ rotate: isOpen ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="text-muted text-lg"
              >
                ›
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-4">
                    {location.units.map((unit) => (
                      <div key={unit.id}>
                        <p className="text-sm font-medium text-muted mb-2">{unit.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {unit.shelves.map((shelf) => (
                            <Link key={shelf.id} href={`/shelf/${shelf.id}`}>
                              <motion.div
                                whileTap={{ scale: 0.94 }}
                                className="bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium"
                              >
                                Shelf {shelf.shelf_number}
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}
