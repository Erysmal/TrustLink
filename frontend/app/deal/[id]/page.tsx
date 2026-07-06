"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BrowserProvider, Contract, parseUnits } from "ethers";
import { AuthGuard } from "../../_components/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { getMagic } from "@/lib/magic";
import { DealPipeline, StatusBadge } from "../../_components/trustlink-ui";
import { formatAddress, formatAmount, formatDateTime, getDealById, normalizeDeal, type TrustLinkDeal } from "../../lib/trustlink";

type DealPageParams = { id?: string | string[] };

const ESCROW_ADDRESS = "0x1f4505F6d26320ba1157424Abd349a54Ebc9eD90";
const USDC_ADDRESS = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const ESCROW_ABI = [
  "function fundDeal(uint256 dealId) external",
];
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];

async function fetchDeal(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/deals/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const raw = (await response.json()) as Record<string, unknown>;

    if ("success" in raw && raw.success !== true) {
      return null;
    }

    if (!raw.deal || typeof raw.deal !== "object") {
      return null;
    }

    return normalizeDeal(raw.deal as Record<string, unknown>, id);
  } catch (e) {
    console.error("fetchDeal error:", e);
    return null;
  }
}

export default function DealPage({
  params,
}: {
  params: DealPageParams | Promise<DealPageParams>;
}) {
  const [resolvedParams, setResolvedParams] = useState<DealPageParams | null>(null);

  useEffect(() => {
    Promise.resolve(params).then((p) => setResolvedParams(p as DealPageParams));
  }, [params]);

  const id = Array.isArray(resolvedParams?.id) ? resolvedParams.id[0] : resolvedParams?.id;
  const { walletAddress, loading } = useAuth();
  const [deal, setDeal] = useState<TrustLinkDeal | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(Boolean(id));
  const [isFunding, setIsFunding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setDeal(null);
      setIsLoadingDeal(false);
      return;
    }

    let cancelled = false;
    setIsLoadingDeal(true);
    setError(null);
    setMessage(null);

    (async () => {
      const liveDeal = await fetchDeal(id);
      if (cancelled) return;
      setDeal(liveDeal ?? getDealById(id) ?? null);
      setIsLoadingDeal(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  async function handleFundDeal() {
    if (!deal) return;

    setIsFunding(true);
    setError(null);
    setMessage(null);

    try {
      if (!walletAddress) {
        throw new Error("Connect your Magic wallet before funding a deal.");
      }

      const magic = await getMagic();
      if (!magic) {
        throw new Error("Magic is not initialized.");
      }

      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Magic signer does not match the connected buyer wallet.");
      }

      if (deal.buyerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Only the buyer can fund this deal.");
      }

      const dealId = parseDealId(deal.id);
      const amount = parseUnits(String(deal.amount), 6);
      const usdc = new Contract(USDC_ADDRESS, ERC20_ABI, signer);
      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

      const approveTx = await usdc.approve(ESCROW_ADDRESS, amount);
      await approveTx.wait();

      const fundTx = await escrow.fundDeal(dealId);
      await fundTx.wait();

      setDeal((current) => (current ? { ...current, status: "Funded" } : current));
      setMessage("Deal funded successfully.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Fund request failed.");
    } finally {
      setIsFunding(false);
    }
  }

  if (!id) {
    return (
      <AuthGuard>
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-8 text-slate-300">
            Deal not found.
          </div>
        </section>
      </AuthGuard>
    );
  }

  if (!deal && isLoadingDeal) {
    return (
      <AuthGuard>
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-8 text-slate-300">
            Loading deal...
          </div>
        </section>
      </AuthGuard>
    );
  }

  if (!deal) {
    return (
      <AuthGuard>
        <section className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-8 text-slate-300">
            Deal not found.
          </div>
        </section>
      </AuthGuard>
    );
  }

  const canFundDeal = Boolean(
    !loading && walletAddress && deal.status === "Created" && deal.buyerAddress.toLowerCase() === walletAddress.toLowerCase(),
  );

  return (
    <AuthGuard>
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">Deal {deal.id}</p>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white">{deal.title}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-300">{deal.description}</p>
              </div>
              <StatusBadge status={deal.status} />
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Amount" value={`${formatAmount(deal.amount)} USDC`} />
              <Metric label="Fee" value={`${formatAmount(deal.fee ?? 0)} USDC`} />
              <Metric label="Deadline" value={formatDateTime(deal.deadline)} />
              <Metric label="Channel" value={deal.channel} />
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Deal details</p>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <Detail label="Deal ID" value={deal.id} />
                <Detail label="Status" value={deal.status} />
                <Detail label="Buyer" value={formatAddress(deal.buyerAddress)} />
                <Detail label="Seller" value={formatAddress(deal.sellerAddress)} />
                <Detail label="Amount" value={`${formatAmount(deal.amount)} USDC`} />
                <Detail label="Fee" value={`${formatAmount(deal.fee ?? 0)} USDC`} />
                <Detail label="Created" value={deal.createdAt ? formatDateTime(deal.createdAt) : "Pending"} />
                <Detail label="Delivery deadline" value={formatDateTime(deal.deadline)} />
                <Detail label="Auto-release" value={deal.autoReleaseAt ? formatDateTime(deal.autoReleaseAt) : "Pending"} />
                <Detail label="Channel" value={deal.channel} />
              </dl>
            </div>

            {deal.status === "Disputed" ? (
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100">
                <p className="font-semibold">Dispute opened</p>
                <p className="mt-2 text-rose-100/85">
                  {deal.disputeReason || "The deal is paused while both sides resolve the issue."}
                </p>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6">
            <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pipeline</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Milestone flow</h2>
              <div className="mt-6">
                <DealPipeline status={deal.status} />
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Actions</p>
              <h2 className="mt-3 text-xl font-semibold text-white">Available buttons</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {canFundDeal ? (
                  <button
                    type="button"
                    onClick={handleFundDeal}
                    disabled={isFunding}
                    className="inline-flex h-12 items-center justify-center rounded-full border border-[#F59E0B] bg-[#F59E0B] px-4 text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFunding ? "Funding..." : "Fund Deal"}
                  </button>
                ) : (
                  <ActionButton label="Fund Deal" active={deal.status === "Funded"} disabled />
                )}
                <ActionButton
                  label="Confirm"
                  active={deal.status === "Funded"}
                  disabled={deal.status !== "Funded"}
                />
                <ActionButton
                  label="Dispute"
                  active={deal.status === "Funded"}
                  disabled={deal.status === "Completed" || deal.status === "Created"}
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Buttons reflect the current status. Fund Deal approves USDC and submits the escrow funding transaction.
              </p>
              {message ? (
                <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-sm font-medium text-slate-100">{value}</dd>
    </div>
  );
}

function ActionButton({
  label,
  active,
  disabled,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex h-12 items-center justify-center rounded-full border px-4 text-sm font-semibold transition ${
        active
          ? "border-[#F59E0B] bg-[#F59E0B] text-[#080D1A]"
          : disabled
            ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-slate-500"
            : "border-white/10 bg-white/[0.03] text-slate-100 hover:border-[#F59E0B]/40 hover:bg-white/5"
      }`}
    >
      {label}
    </button>
  );
}

function parseDealId(value: string) {
  if (!/^\d+$/.test(value)) {
    throw new Error("This deal id is not a numeric on-chain ID.");
  }

  return BigInt(value);
}
