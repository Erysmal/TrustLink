"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Contract, BrowserProvider, isAddress, parseUnits } from "ethers";
import type { Log, LogDescription } from "ethers";
import { useAuth } from "@/context/AuthContext";
import { getMagic } from "@/lib/magic";
import type { DealChannel } from "../lib/trustlink";

const ESCROW_ADDRESS = "0x1f4505F6d26320ba1157424Abd349a54Ebc9eD90";
const ESCROW_ABI = [
  "function createDeal(address buyer, uint256 amount, uint64 deliveryDeadline, string description, string channel) external returns (uint256 dealId)",
  "event DealCreated(uint256 indexed dealId, address indexed seller, address indexed buyer, uint256 amount, uint256 fee, uint64 deliveryDeadline, uint64 autoReleaseAt, string description, string channel)",
];

type FormState = {
  buyerAddress: string;
  amount: string;
  deadline: string;
  description: string;
  channel: DealChannel;
};

function toDateTimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-") + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function CreateDealForm() {
  const router = useRouter();
  const { walletAddress, loading } = useAuth();
  const [form, setForm] = useState<FormState>(() => {
    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000);
    return {
      buyerAddress: "",
      amount: "",
      deadline: toDateTimeLocalValue(deadline),
      description: "",
      channel: "telegram",
    };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      if (!walletAddress) {
        throw new Error("Connect your Magic wallet before creating a deal.");
      }
      if (!isAddress(form.buyerAddress)) {
        throw new Error("Enter a valid buyer wallet address.");
      }

      const magic = await getMagic();
      if (!magic) {
        throw new Error("Magic is not initialized.");
      }

      const provider = new BrowserProvider(magic.rpcProvider);
      const signer = await provider.getSigner();
      const sellerAddress = await signer.getAddress();

      if (sellerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Magic signer does not match the connected seller wallet.");
      }

      const amount = parseUnits(form.amount, 6);
      const deadline = Math.floor(new Date(form.deadline).getTime() / 1000);
      if (!Number.isFinite(deadline) || deadline <= Math.floor(Date.now() / 1000)) {
        throw new Error("Choose a future delivery deadline.");
      }

      const escrow = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
      const tx = await escrow.createDeal(
        form.buyerAddress,
        amount,
        deadline,
        form.description,
        form.channel,
      );
      const receipt = await tx.wait();
      const logs = (receipt?.logs ?? []) as Log[];
      let createdLog: LogDescription | null = null;
      for (const log of logs) {
        try {
          const parsed = escrow.interface.parseLog(log);
          if (parsed?.name === "DealCreated") {
            createdLog = parsed;
            break;
          }
        } catch {}
      }
      const dealId = createdLog?.args?.dealId?.toString();
      setMessage(dealId ? `Deal created successfully: ${dealId}` : "Deal created successfully.");
      if (dealId) {
        router.push(`/deal/${dealId}`);
      }
      setForm((current) => ({
        ...current,
        buyerAddress: "",
        amount: "",
        description: "",
      }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Create request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
      <div className="grid gap-5">
        <Field label="Buyer address">
          <input
            required
            value={form.buyerAddress}
            onChange={(event) => setForm((current) => ({ ...current, buyerAddress: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
            placeholder="0x..."
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="USDC amount">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
              placeholder="2500"
            />
          </Field>

          <Field label="Delivery deadline">
            <input
              required
              type="datetime-local"
              value={form.deadline}
              onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
            />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            required
            rows={5}
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
            placeholder="Describe what should be delivered and what triggers release."
          />
        </Field>

        <Field label="Channel">
          <select
            value={form.channel}
            onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as DealChannel }))}
            className="w-full rounded-2xl border border-white/10 bg-[#080D1A] px-4 py-3 text-sm text-white outline-none transition focus:border-[#F59E0B]/50 focus:ring-2 focus:ring-[#F59E0B]/20"
          >
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="web">Web</option>
          </select>
        </Field>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting || loading || !walletAddress}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#F59E0B] px-6 text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create deal"}
        </button>
        <p className="text-sm text-slate-400">
          Seller: {walletAddress ?? "Connect Magic wallet"} - USDC only.
        </p>
      </div>

      {message ? (
        <p className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
