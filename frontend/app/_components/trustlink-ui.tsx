import Link from "next/link";
import {
  formatAddress,
  formatAmount,
  formatDateTime,
  getStageIndex,
  type DealChannel,
  type DealSide,
  type DealStatus,
  type TrustLinkDeal,
} from "../lib/trustlink";

const statusStyles: Record<DealStatus, string> = {
  Created: "border-sky-400/20 bg-sky-500/10 text-sky-200",
  Funded: "border-amber-400/20 bg-amber-500/10 text-amber-200",
  Completed: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
  Disputed: "border-rose-400/20 bg-rose-500/10 text-rose-200",
};

const channelStyles: Record<DealChannel, string> = {
  telegram: "border-cyan-400/20 bg-cyan-500/10 text-cyan-200",
  whatsapp: "border-lime-400/20 bg-lime-500/10 text-lime-200",
  web: "border-violet-400/20 bg-violet-500/10 text-violet-200",
};

export function StatusBadge({ status }: { status: DealStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

export function ChannelPill({ channel }: { channel: DealChannel }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize ${channelStyles[channel]}`}>
      {channel}
    </span>
  );
}

export function DealCard({ deal }: { deal: TrustLinkDeal }) {
  return (
    <Link
      href={`/deal/${deal.id}`}
      className="group block rounded-2xl border border-white/10 bg-[#0F1629] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#F59E0B]/35 hover:shadow-[0_16px_40px_rgba(0,0,0,0.32)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{deal.side}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{deal.title}</h3>
        </div>
        <StatusBadge status={deal.status} />
      </div>

      <div className="mt-5 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
        <div>
          <p className="text-slate-500">Amount</p>
          <p className="mt-1 text-base font-semibold text-white">{formatAmount(deal.amount)} USDC</p>
        </div>
        <div>
          <p className="text-slate-500">Deadline</p>
          <p className="mt-1 text-base font-semibold text-white">{formatDateTime(deal.deadline)}</p>
        </div>
        <div>
          <p className="text-slate-500">Channel</p>
          <p className="mt-1">
            <ChannelPill channel={deal.channel} />
          </p>
        </div>
      </div>

      <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-400">{deal.description}</p>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-xs text-slate-500 sm:grid-cols-2">
        <div>
          <p className="uppercase tracking-[0.2em] text-slate-600">Buyer</p>
          <p className="mt-1 font-medium text-slate-300">{formatAddress(deal.buyerAddress)}</p>
        </div>
        <div>
          <p className="uppercase tracking-[0.2em] text-slate-600">Seller</p>
          <p className="mt-1 font-medium text-slate-300">{formatAddress(deal.sellerAddress)}</p>
        </div>
      </div>

      <div className="mt-5 text-sm font-semibold text-[#F59E0B] transition group-hover:translate-x-0.5">
        Open deal
      </div>
    </Link>
  );
}

export function DealPipeline({ status }: { status: DealStatus }) {
  const stage = getStageIndex(status);
  const steps = [
    {
      title: "Deal created",
      detail: "Terms are drafted and the escrow request is open.",
    },
    {
      title: "Buyer funds escrow",
      detail: "USDC is locked until the delivery condition is met.",
    },
    {
      title: "Buyer confirms delivery",
      detail: "Release can only happen after the agreed handoff.",
    },
    {
      title: "Funds auto-release",
      detail: "The escrow settles and the deal closes.",
    },
  ];

  return (
    <ol className="grid gap-4">
      {steps.map((step, index) => {
        const isDone = stage > index;
        const isCurrent = stage === index;
        const isBlocked = status === "Disputed" && index >= 2;

        return (
          <li
            key={step.title}
            className={`rounded-2xl border p-4 ${
              isBlocked
                ? "border-rose-400/20 bg-rose-500/5"
                : isCurrent
                  ? "border-[#F59E0B]/35 bg-[#F59E0B]/10"
                  : isDone
                    ? "border-emerald-400/20 bg-emerald-500/5"
                    : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold ${
                  isBlocked
                    ? "border-rose-400/30 bg-rose-500/20 text-rose-100"
                    : isCurrent
                      ? "border-[#F59E0B]/45 bg-[#F59E0B] text-[#080D1A]"
                      : isDone
                        ? "border-emerald-400/30 bg-emerald-500/20 text-emerald-100"
                        : "border-white/10 bg-white/5 text-slate-400"
                }`}
              >
                {index + 1}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">{step.detail}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
