"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Program } from "@/lib/site-data";

export function ProgramCard({ program }: { program: Program }) {
  return (
    <motion.article whileHover={{ y: -6 }} className="glass-card rounded-xl p-6 shadow-glass">
      <h3 className="text-lg font-semibold text-newton-dark">{program.title}</h3>
      <p className="mt-2 text-sm text-newton-dark/75">{program.description}</p>
      <Link href={`/programs/${program.slug}`} className="mt-4 inline-block text-sm font-semibold text-newton-red hover:text-newton-accent">
        View pathway details
      </Link>
    </motion.article>
  );
}
