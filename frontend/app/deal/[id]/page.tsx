import { DealPipeline, StatusBadge } from "../../_components/trustlink-ui";
import { getDealById, formatAddress, formatAmount, formatDateTime, normalizeDeal } from "../../lib/trustlink";
import { AuthGuard } from "../../_components/AuthGuard";

type DealPageParams = { id?: string | string[] };

async function fetchDeal(id: string) {
  try {
    const response = await fetch(`http://localhost:3001/api/deals/${encodeURIComponent(id)}`, {
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
  } catch {
    return null;
  }
}

export default async function DealPage({
  params,
}: {
  params: DealPageParams | Promise<DealPageParams>;
}) {
  const resolvedParams = await params;
  const id = Array.isArray(resolvedParams.id) ? resolvedParams.id[0] : resolvedParams.id;

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

  const liveDeal = await fetchDeal(id);
  const fallbackDeal = getDealById(id);
  const deal = liveDeal ?? fallbackDeal;

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
              <ActionButton
                label="Fund"
                active={deal.status === "Created"}
                disabled={deal.status !== "Created"}
              />
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
              Buttons reflect the current status. Fund unlocks the deal, Confirm closes it, and Dispute marks it for review.
            </p>
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
