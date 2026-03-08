"use client";

import { motion } from "framer-motion";

import { AnimatedSection } from "./AnimatedSection";
import { services } from "../lib/content";

export function ServicesSection() {
  return (
    <AnimatedSection id="services" className="section-shell mt-24">
      <div className="mb-8 max-w-3xl">
        <p className="section-kicker">Services</p>
        <h2 className="section-title">Systems and platforms designed to scale your operation</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.article
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.75, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="service-card group"
            >
              <div className="mb-5 inline-flex rounded-xl border border-cyan-300/30 bg-cyan-300/10 p-3 text-cyan-200">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/72">{service.short}</p>
              <p className="mt-4 max-h-0 overflow-hidden border-t border-white/0 pt-0 text-sm leading-relaxed text-cyan-100/0 transition-all duration-300 group-hover:max-h-48 group-hover:border-white/10 group-hover:pt-4 group-hover:text-cyan-100/80">
                {service.details}
              </p>
            </motion.article>
          );
        })}
      </div>
    </AnimatedSection>
  );
}
