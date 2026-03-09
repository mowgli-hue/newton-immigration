"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { testimonials } from "@/lib/site-data";

export function TestimonialsCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-glass">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Client Success Stories</h2>
        <div className="flex gap-2">
          {testimonials.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`h-2.5 w-2.5 rounded-full ${idx === active ? "bg-newton-red" : "bg-black/20"}`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.article
          key={testimonials[active].name}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.35 }}
          className="glass-card rounded-xl p-5"
        >
          <p className="text-sm leading-7 text-newton-dark/80">"{testimonials[active].text}"</p>
          <p className="mt-3 text-sm font-semibold text-newton-dark">{testimonials[active].name}</p>
          <p className="text-xs text-newton-dark/70">{testimonials[active].location}</p>
        </motion.article>
      </AnimatePresence>
    </div>
  );
}
