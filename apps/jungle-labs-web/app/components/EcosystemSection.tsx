"use client";

import { motion } from "framer-motion";

import { AnimatedSection } from "./AnimatedSection";
import { ecosystemNodes } from "../lib/content";

const nodePositions = [
  { x: 120, y: 70 },
  { x: 320, y: 55 },
  { x: 505, y: 135 },
  { x: 500, y: 300 },
  { x: 310, y: 355 },
  { x: 115, y: 285 }
];

const center = { x: 310, y: 205 };

export function EcosystemSection() {
  return (
    <AnimatedSection id="ecosystem" className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Technology Ecosystem</p>
        <h2 className="section-title">Your business connected to an intelligent system architecture</h2>
      </div>

      <div className="glass-card overflow-hidden p-4 md:p-8">
        <svg viewBox="0 0 620 420" className="h-auto w-full" role="img" aria-label="Technology ecosystem diagram">
          {nodePositions.map((position, index) => (
            <motion.line
              key={`line-${index}`}
              x1={center.x}
              y1={center.y}
              x2={position.x}
              y2={position.y}
              stroke="url(#nodeLine)"
              strokeWidth="1.4"
              initial={{ pathLength: 0, opacity: 0.2 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.14 }}
            />
          ))}

          <defs>
            <linearGradient id="nodeLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>

          <motion.g initial={{ scale: 0.9, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <circle cx={center.x} cy={center.y} r={54} fill="rgba(16, 185, 129, 0.18)" stroke="rgba(94, 234, 212, 0.6)" />
            <text x={center.x} y={center.y - 4} textAnchor="middle" fill="#d1fae5" fontSize="16" fontWeight="600">
              Your
            </text>
            <text x={center.x} y={center.y + 18} textAnchor="middle" fill="#d1fae5" fontSize="16" fontWeight="600">
              Business
            </text>
          </motion.g>

          {nodePositions.map((position, index) => (
            <motion.g
              key={`node-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.25, duration: 0.45 }}
            >
              <circle cx={position.x} cy={position.y} r={39} fill="rgba(8, 14, 26, 0.95)" stroke="rgba(56, 189, 248, 0.45)" />
              <text x={position.x} y={position.y - 5} textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="500">
                {ecosystemNodes[index].split(" ").slice(0, 2).join(" ")}
              </text>
              <text x={position.x} y={position.y + 11} textAnchor="middle" fill="#e2e8f0" fontSize="10.5" fontWeight="500">
                {ecosystemNodes[index].split(" ").slice(2).join(" ")}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>
    </AnimatedSection>
  );
}
