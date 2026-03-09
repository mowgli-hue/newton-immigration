"use client";

import { useState } from "react";

type Plan = "basic" | "full";

const priceMap: Record<Plan, number> = {
  basic: 9,
  full: 29
};

export function PricingCards() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);

  const checkout = async (plan: Plan) => {
    setLoadingPlan(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[{ id: "basic", title: "Basic Analysis", text: "Fast score assessment and summary.", price: "$9" }, { id: "full", title: "Full PR Strategy Report", text: "Detailed roadmap with PNP and timeline strategy.", price: "$29" }].map((plan) => (
        <article key={plan.id} className="glass-card rounded-xl p-5 shadow-glass">
          <h3 className="text-lg font-semibold">{plan.title}</h3>
          <p className="mt-2 text-sm text-newton-dark/75">{plan.text}</p>
          <p className="mt-4 text-3xl font-semibold text-newton-red">{plan.price}</p>
          <button onClick={() => checkout(plan.id as Plan)} className="mt-4 rounded-md bg-newton-red px-4 py-2 text-sm font-semibold text-white">
            {loadingPlan === plan.id ? "Redirecting..." : `Pay ${priceMap[plan.id as Plan]} USD`}
          </button>
        </article>
      ))}
    </div>
  );
}
