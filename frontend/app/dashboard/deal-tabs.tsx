"use client";

import { useState } from "react";
import { DealCard } from "../_components/trustlink-ui";
import type { TrustLinkDeal } from "../lib/trustlink";

const tabs = ["All", "Selling", "Buying"] as const;

export function DealTabs({ deals }: { deals: TrustLinkDeal[] }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("All");

  const filteredDeals = activeTab === "All" ? deals : deals.filter((deal) => deal.side === activeTab);

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-[#0F1629] p-2">
        {tabs.map((tab) => {
          const active = activeTab === tab;
          const count = tab === "All" ? deals.length : deals.filter((deal) => deal.side === tab).length;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              aria-pressed={active}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-[#F59E0B] text-[#080D1A]"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {tab} <span className={active ? "text-[#080D1A]/75" : "text-slate-500"}>{count}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {filteredDeals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>

      {filteredDeals.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-white/10 bg-[#0F1629] p-8 text-sm text-slate-400">
          No deals found in this view.
        </div>
      ) : null}
    </div>
  );
}
