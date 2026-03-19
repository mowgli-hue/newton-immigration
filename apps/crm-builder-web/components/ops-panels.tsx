import { AlertTriangle, CheckCircle2, MessageSquareText, UserRoundCheck } from "lucide-react";
import { CaseItem, sampleCases } from "@/lib/data";

type OpsPanelsProps = {
  cases?: CaseItem[];
};

export function OpsPanels({ cases = sampleCases }: OpsPanelsProps) {
  const reviewQueue = cases.filter((c) => c.stage === "Under Review");
  const pendingAssign = cases.filter((c) => c.stage === "Paid" || c.stage === "Intake");
  const attention = cases.filter((c) => c.docsPending > 0 || c.unreadClientMessages > 0);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <UserRoundCheck size={18} className="text-accent" /> Auto Assignment
        </h3>
        <p className="mt-1 text-xs text-slate-600">Least-loaded owner first. Reviewer always different from owner.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {pendingAssign.map((c) => (
            <li key={c.id} className="rounded border border-slate-200 p-2">
              {c.id} • {c.client} • {c.formType}
            </li>
          ))}
          {pendingAssign.length === 0 ? <li className="text-xs text-slate-400">Queue clear</li> : null}
        </ul>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <CheckCircle2 size={18} className="text-accent" /> Review Queue
        </h3>
        <p className="mt-1 text-xs text-slate-600">Second-level quality check before submission.</p>
        <ul className="mt-3 space-y-2 text-sm">
          {reviewQueue.map((c) => (
            <li key={c.id} className="rounded border border-slate-200 p-2">
              {c.id} • Reviewer: {c.reviewer}
            </li>
          ))}
          {reviewQueue.length === 0 ? <li className="text-xs text-slate-400">No items under review</li> : null}
        </ul>
      </article>

      <article className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-soft">
        <h3 className="flex items-center gap-2 text-base font-semibold text-amber-900">
          <AlertTriangle size={18} className="text-warning" /> Attention Needed
        </h3>
        <p className="mt-1 text-xs text-amber-800">Client messaging or docs pending.</p>
        <ul className="mt-3 space-y-2 text-sm text-amber-900">
          {attention.map((c) => (
            <li key={c.id} className="rounded border border-amber-200 bg-white p-2">
              {c.id} • {c.unreadClientMessages} unread • {c.docsPending} docs pending
            </li>
          ))}
        </ul>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft lg:col-span-2">
        <h3 className="flex items-center gap-2 text-base font-semibold text-ink">
          <MessageSquareText size={18} className="text-accent" /> Client Portal Messaging
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Work-only chat per case with document requests, approvals, and audit trail.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-3 text-xs">Realtime chat and read receipts</div>
          <div className="rounded-lg border border-slate-200 p-3 text-xs">Secure docs, reminders, and escalation alerts</div>
        </div>
      </article>
    </section>
  );
}
