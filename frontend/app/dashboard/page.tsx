import { DealTabs } from "./deal-tabs";
import { sampleDeals } from "../lib/trustlink";

export default function DashboardPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Open deals and escrow state</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Review active deals, filter by side, and jump straight into the deal detail view.
        </p>
      </div>

      <div className="mt-10">
        <DealTabs deals={sampleDeals} />
      </div>
    </section>
  );
}
