"use client";

import { motion } from "framer-motion";
import { immigrationTypes } from "@/lib/site-data";

export function ImmigrationTypesGallery() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {immigrationTypes.map((item) => (
        <motion.article
          key={item.title}
          whileHover={{ y: -6 }}
          className="group relative overflow-hidden rounded-xl shadow-glass"
        >
          <img src={item.image} alt={item.title} className="h-60 w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-0 p-4 text-white">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-1 text-sm text-white/85">{item.text}</p>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
