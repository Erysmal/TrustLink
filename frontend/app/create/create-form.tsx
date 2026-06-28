"use client";

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { DealChannel } from "../lib/trustlink";

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
      const response = await fetch("http://localhost:3001/api/deals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          buyerAddress: form.buyerAddress,
          amount: Number(form.amount),
          deliveryDeadline: new Date(form.deadline).toISOString(),
          description: form.description,
          channel: form.channel,
          asset: "USDC",
        }),
      });

      const raw = await response.text();
      let data: any = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          data = { message: raw };
        }
      }

      if (!response.ok) {
        throw new Error(data?.message || "Unable to create deal.");
      }

      const dealId = data?.deal?.id ?? data?.id ?? data?.dealId;
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
          disabled={isSubmitting}
          className="inline-flex h-12 items-center justify-center rounded-full bg-[#F59E0B] px-6 text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Creating..." : "Create deal"}
        </button>
        <p className="text-sm text-slate-400">USDC only. Backend response may redirect you to the new deal.</p>
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
  children: React.ReactNode;
}>) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}
