export default function Loading() {
  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/10 bg-[#0F1629] p-6">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="mt-6 h-10 w-2/3 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-6 w-full animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-3 h-6 w-5/6 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
            <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
          </div>
        </div>
        <div className="grid gap-6">
          <div className="h-64 animate-pulse rounded-[28px] border border-white/10 bg-[#0F1629]" />
          <div className="h-36 animate-pulse rounded-[28px] border border-white/10 bg-[#0F1629]" />
        </div>
      </div>
    </section>
  );
}
