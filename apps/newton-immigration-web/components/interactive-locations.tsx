"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { locations } from "@/lib/site-data";

export function InteractiveLocations() {
  const [active, setActive] = useState(0);
  const current = locations[active];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="glass-card rounded-xl p-4 shadow-glass lg:col-span-1">
        <h3 className="text-lg font-semibold">Select Office</h3>
        <div className="mt-3 space-y-2">
          {locations.map((location, idx) => (
            <button
              key={location.city}
              onClick={() => setActive(idx)}
              className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                idx === active
                  ? "border-newton-red bg-red-950/35 text-newton-dark"
                  : "border-white/10 bg-black/20 text-newton-dark/80 hover:border-newton-red/40"
              }`}
            >
              <p className="font-semibold">{location.city}</p>
              <p className="text-xs">{location.phone}</p>
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={current.city}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="glass-card overflow-hidden rounded-xl shadow-glass lg:col-span-2"
      >
        <iframe title={current.city} src={current.map} className="h-64 w-full border-0" loading="lazy" />
        <div className="p-4 text-sm">
          <h4 className="text-base font-semibold">{current.city}</h4>
          <p className="mt-1 text-newton-dark/75">{current.address}</p>
          <p className="mt-2">{current.phone}</p>
          <p>{current.email}</p>
        </div>
      </motion.div>
    </div>
  );
}
