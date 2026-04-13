"use client";
import { useState } from "react";

interface URPanelProps {
  caseId: string | null;
  cases: any[];
  sessionUser: any;
  teamUsers: any[];
  onClose: () => void;
  onUpdate: (caseId: string, patch: any) => void;
  onSubmit: (caseId: string, appNum: string) => Promise<void>;
  onAddNote: (caseId: string, text: string, author: string) => Promise<void>;
  setCaseActionStatus: (s: string) => void;
}

export default function UnderReviewPanel({
  caseId, cases, sessionUser, teamUsers, onClose, onUpdate, onSubmit, onAddNote, setCaseActionStatus
}: URPanelProps) {
  const [notesValue, setNotesValue] = useState("");
  const [appNum, setAppNum] = useState("");

  if (!caseId) return null;
  const urCase = cases.find(c => c.id === caseId);
  if (!urCase) return null;

  const reviewedBy = (urCase as any).reviewedBy;
  const reviewStatus = (urCase as any).reviewStatus; // "reviewing" | "changes_needed" | "changes_done"
  const reviewNotes = (urCase as any).reviewNotes || "";

  const reviewerNames = teamUsers.length > 0
    ? teamUsers.filter(u => u.active !== false && ["Processing","ProcessingLead","Admin"].includes(u.role)).map((u: any) => u.name)
    : ["Ramandeep Kaur","Rajwinder Kaur","Avneet Kaur","Simi Das","Manisha","Rapneet Kaur","Sukhman"];

  // Determine which step we are on
  const step = !reviewedBy ? 1
    : reviewStatus === "changes_needed" ? 3
    : reviewStatus === "changes_done" ? 4
    : 2; // "reviewing" or anything else

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-0" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">👁 Under Review — {urCase.client}</p>
            <p className="text-xs text-amber-100">{urCase.formType} · {urCase.id} · Assigned: {urCase.assignedTo || "Unassigned"}</p>
          </div>
          <button onClick={onClose} className="text-amber-100 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[
            { n: 1, label: "Reviewer" },
            { n: 2, label: "Review" },
            { n: 3, label: "Changes" },
            { n: 4, label: "Submit" },
          ].map(s => (
            <div key={s.n} className={`flex-1 py-2 text-center text-[10px] font-bold ${step === s.n ? "text-amber-700 border-b-2 border-amber-500 bg-white" : step > s.n ? "text-emerald-600" : "text-slate-400"}`}>
              {step > s.n ? "✓ " : ""}{s.label}
            </div>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-[65vh] overflow-auto">

          {/* Step 1: Pick reviewer */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-700">Who is reviewing this case?</p>
              <select id="ur-name-sel" defaultValue={sessionUser?.name || ""}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none">
                <option value="">Select your name...</option>
                {reviewerNames.map((n: string) => <option key={n} value={n}>{n}</option>)}
              </select>
              <button onClick={async () => {
                const name = (document.getElementById("ur-name-sel") as HTMLSelectElement)?.value;
                if (!name) { setCaseActionStatus("❌ Select your name first"); return; }
                onUpdate(urCase.id, { reviewedBy: name, reviewStatus: "reviewing" });
                onClose();
                setCaseActionStatus("✅ You are now reviewing " + urCase.client);
                setTimeout(() => setCaseActionStatus(""), 3000);
              }} className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700">
                👁 Start Reviewing
              </button>
            </div>
          )}

          {/* Step 2: Reviewer writes what needs to change */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Reviewer: {reviewedBy}</span>
              </div>
              <p className="text-sm font-bold text-slate-700">Write what needs to be changed</p>
              <p className="text-[11px] text-slate-400">This will notify <strong>{urCase.assignedTo || "assigned staff"}</strong> in CRM notes</p>
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                placeholder="e.g. Passport copy is unclear, need employment letter page 2, fix date of birth..."
                rows={4}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none resize-none" />
              <button onClick={async () => {
                const notes = notesValue.trim();
                if (!notes) { setCaseActionStatus("❌ Write the changes needed first"); return; }
                onUpdate(urCase.id, { reviewNotes: notes, reviewStatus: "changes_needed" });
                await onAddNote(urCase.id,
                  "⚠️ CHANGES NEEDED (by " + reviewedBy + "):\n" + notes,
                  reviewedBy || sessionUser?.name || "Reviewer"
                );
                onClose();
                setCaseActionStatus("⚠️ Changes sent to " + (urCase.assignedTo || "staff") + " in CRM notes");
                setTimeout(() => setCaseActionStatus(""), 5000);
              }} className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">
                ⚠️ Send Changes to {urCase.assignedTo || "Assigned Staff"}
              </button>
              <button onClick={() => { onUpdate(urCase.id, { reviewStatus: "changes_done" }); onClose(); setCaseActionStatus("✅ Marked ready to submit"); setTimeout(()=>setCaseActionStatus(""),3000); }}
                className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                ✅ No Changes — Ready to Submit
              </button>
            </div>
          )}

          {/* Step 3: Assigned staff sees changes and marks done */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Reviewer: {reviewedBy}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">⚠️ Changes Needed</span>
              </div>
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3">
                <p className="text-xs font-bold text-red-700 mb-1">Changes required by {reviewedBy}:</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{reviewNotes}</p>
              </div>
              <button onClick={async () => {
                onUpdate(urCase.id, { reviewStatus: "changes_done" });
                await onAddNote(urCase.id,
                  "✅ Changes done by " + (sessionUser?.name || "staff") + " — ready for re-review.",
                  sessionUser?.name || "staff"
                );
                onClose();
                setCaseActionStatus("✅ Changes done — reviewer notified in CRM notes");
                setTimeout(() => setCaseActionStatus(""), 4000);
              }} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                ✅ Changes Done — Notify Reviewer
              </button>
              <button onClick={async () => {
                // Reviewer wants to update notes
                onUpdate(urCase.id, { reviewStatus: "reviewing" });
                onClose();
                setCaseActionStatus("Reopened for review");
                setTimeout(() => setCaseActionStatus(""), 2000);
              }} className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                ✏️ Edit Changes (Reviewer)
              </button>
            </div>
          )}

          {/* Step 4: Submit */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Reviewer: {reviewedBy}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">✅ Changes Done</span>
              </div>
              <p className="text-sm font-bold text-slate-700">Ready to submit — enter application number</p>
              <input
                value={appNum || (urCase as any).applicationNumber || ""}
                onChange={e => setAppNum(e.target.value)}
                placeholder="App number e.g. W311024778"
                className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm focus:border-emerald-400 focus:outline-none" />
              <button onClick={async () => {
                const num = (appNum || (urCase as any).applicationNumber || "").trim().toUpperCase();
                if (!num) { setCaseActionStatus("❌ Enter application number"); return; }
                await onSubmit(urCase.id, num);
                onClose();
              }} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                🚀 Submit Application
              </button>
              <button onClick={() => { onUpdate(urCase.id, { reviewStatus: "changes_needed" }); onClose(); }}
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                ← More Changes Needed
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
