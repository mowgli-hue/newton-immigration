"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

export function AnimatedCounter({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref, { once: true });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (latest) => Math.round(latest));

  useEffect(() => {
    if (!isInView) return;
    const controls = animate(mv, value, { duration: 1.2, ease: "easeOut" });
    return () => controls.stop();
  }, [isInView, mv, value]);

  return (
    <div ref={ref} className="glass-card rounded-xl p-5 text-center shadow-glass">
      <motion.p className="text-3xl font-semibold text-newton-red">{rounded}</motion.p>
      <p className="mt-1 text-sm text-newton-dark/70">{label}</p>
    </div>
  );
}
