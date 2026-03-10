"use client";

import { motion } from "framer-motion";
import { immigrationTypes } from "@/lib/site-data";
import { BriefcaseBusiness, GraduationCap, Layers3, PlaneTakeoff } from "lucide-react";

const iconMap: Record<string, any> = {
  "Express Entry": Layers3,
  "Study Permits": GraduationCap,
  "Work Permits": BriefcaseBusiness,
  "PNP Programs": PlaneTakeoff
};

export function ImmigrationTypesGallery() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {immigrationTypes.map((item) => (
        <motion.article
          key={item.title}
          whileHover={{ y: -6 }}
          className="group relative overflow-hidden rounded-xl border border-white/10 shadow-glass"
        >
          <div className={`h-60 bg-gradient-to-br ${item.tone} p-5`}>
            <div className="flex h-full flex-col justify-between">
              <div className="rounded-full border border-white/30 bg-white/10 p-3 w-fit">
                {(() => {
                  const Icon = iconMap[item.title] ?? Layers3;
                  return <Icon className="h-5 w-5 text-white" />;
                })()}
              </div>
              <div className="rounded-lg border border-white/15 bg-black/25 p-4 text-white">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm text-white/85">{item.text}</p>
              </div>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
