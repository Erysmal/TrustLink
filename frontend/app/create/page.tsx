import { CreateDealForm } from "./create-form";
import { AuthGuard } from "../_components/AuthGuard";

export default function CreatePage() {
  return (
    <AuthGuard>
      <section className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F59E0B]">Create deal</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Start an escrow deal</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Capture the counterparty, amount, deadline, and delivery channel, then send the request to the backend.
          </p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0F1629] p-6 text-sm leading-7 text-slate-400">
            The create flow posts directly to `http://localhost:3001/api/deals/create` with the deal payload.
          </div>
        </div>

        <CreateDealForm />
      </section>
    </AuthGuard>
  );
}
