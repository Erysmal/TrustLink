"use client";

import { useEffect, useState } from "react";
import { DealTabs } from "./deal-tabs";
import { AuthGuard } from "../_components/AuthGuard";
import { Footer } from "../_components/Footer";
import { useAuth } from "@/context/AuthContext";
import type { TrustLinkDeal, DealStatus, DealChannel } from "@/app/lib/trustlink";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function normalizeDeal(raw: Record<string, unknown>, walletAddress: string): TrustLinkDeal {
  const seller = (raw.seller as string) || "";
  const buyer = (raw.buyer as string) || "";
  const side = seller.toLowerCase() === walletAddress.toLowerCase() ? "Selling" : "Buying";
  return {
    id: String(raw.dealId ?? raw.id ?? ""),
    title: (raw.description as string) || "",
    description: (raw.description as string) || "",
    amount: parseFloat(String(raw.amount ?? "0")),
    fee: parseFloat(String(raw.fee ?? "0")),
    status: (raw.status as DealStatus) || "Created",
    channel: (raw.channel as DealChannel) || "web",
    deadline: (raw.deliveryDeadline as string) || "",
    autoReleaseAt: (raw.autoReleaseAt as string) || "",
    sellerAddress: seller,
    buyerAddress: buyer,
    side,
  };
}

function DashboardContent() {
  const { walletAddress } = useAuth();
  const [deals, setDeals] = useState<TrustLinkDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDeals() {
      if (!walletAddress) return;
      try {
        setLoading(true);
        setError(null);
        const countRes = await fetch(`${API_URL}/api/deals/count`);
        const countData = await countRes.json();
        const count: number = countData.count ?? 0;
        if (count === 0) { setDeals([]); return; }
        const promises = Array.from({ length: count }, (_, i) =>
          fetch(`${API_URL}/api/deals/${i}`).then((r) => r.json())
        );
        const results = await Promise.all(promises);
        const userDeals = results
          .filter((r) => r.success && r.deal)
          .map((r) => normalizeDeal(r.deal, walletAddress))
          .filter((d) =>
            d.sellerAddress.toLowerCase() === walletAddress.toLowerCase() ||
            d.buyerAddress.toLowerCase() === walletAddress.toLowerCase()
          );
        setDeals(userDeals);
      } catch (err) {
        setError("Failed to load deals. Make sure the backend is running.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDeals();
  }, [walletAddress]);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">Dashboard</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Open deals and escrow state</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">
          Review active deals, filter by side, and jump straight into the deal detail view.
        </p>
        {walletAddress && (
          <p className="mt-2 text-xs text-slate-500">
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        )}
      </div>
      <div className="mt-10">
        {loading && <div className="text-sm text-slate-400">Loading your deals...</div>}
        {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>}
        {!loading && !error && <DealTabs deals={deals} />}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
      <Footer />
    </AuthGuard>
  );
}
