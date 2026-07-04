import Link from "next/link";
import { Footer } from "./_components/Footer";

const steps = [
  {
    title: "Create the deal",
    description: "Set the buyer, the USDC amount, the deadline, and the channel where work is being coordinated.",
  },
  {
    title: "Fund the escrow",
    description: "The buyer deposits USDC into escrow and both sides can track the state in one place.",
  },
  {
    title: "Release on confirmation",
    description: "Once delivery is confirmed or the timer expires, funds auto-release unless a dispute is opened.",
  },
];

const stats = [
  { label: "Fee", value: "0.5%" },
  { label: "Auto-release", value: "48h" },
  { label: "Asset", value: "USDC only" },
];

export default function Home() {
  return (
    <div className="bg-[#080D1A]">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 lg:min-h-[calc(100vh-81px)] lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">TrustLink escrow</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Hold USDC in escrow until the work is delivered.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            TrustLink gives independent teams and buyers a clean way to lock value, follow milestones, and release funds without the back-and-forth.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#F59E0B] px-6 text-sm font-semibold text-[#080D1A] transition hover:bg-[#f7b733]"
            >
              Create a deal
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-6 text-sm font-semibold text-white transition hover:border-[#F59E0B]/40 hover:bg-white/5"
            >
              Open dashboard
            </Link>
	    <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-[#F59E0B]/40 px-6 text-sm font-semibold text-[#F59E0B] transition hover:bg-[#F59E0B]/10"
            >
              Login
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Flow preview</p>
              <p className="mt-2 text-xl font-semibold text-white">Escrow pipeline</p>
            </div>
            <span className="rounded-full border border-[#F59E0B]/25 bg-[#F59E0B]/10 px-3 py-1 text-xs font-semibold text-[#FBBF24]">
              Live-ready
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-sm font-semibold text-[#FBBF24]">
                    {index + 1}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-white">{step.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid w-full max-w-7xl gap-4 px-6 py-6 sm:grid-cols-3">
          {stats.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-[#0F1629] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">How it works</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Three steps. Clear state. No loose money movement.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-[24px] border border-white/10 bg-[#0F1629] p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-sm font-semibold text-[#FBBF24]">
                {index + 1}
              </div>
              <h3 className="mt-5 text-xl font-semibold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{step.description}</p>
            </article>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}
