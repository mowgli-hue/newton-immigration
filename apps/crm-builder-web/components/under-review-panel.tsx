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
  onNotify: (targetName: string, message: string, caseId: string) => Promise<void>;
  setCaseActionStatus: (s: string) => void;
}

export default function UnderReviewPanel({
  caseId, cases, sessionUser, teamUsers, onClose, onUpdate, onSubmit, onAddNote, onNotify, setCaseActionStatus
}: URPanelProps) {
  const [notesValue, setNotesValue] = useState("");
  const [appNum, setAppNum] = useState("");

  if (!caseId) return null;
  const urCase = cases.find(c => c.id === caseId);
  if (!urCase) return null;

  const reviewedBy = (urCase as any).reviewedBy || "";
  const reviewStatus = (urCase as any).reviewStatus;
  const reviewNotes = (urCase as any).reviewNotes || "";
  const myName = sessionUser?.name || "Reviewer";

  // Step: if no reviewer yet → auto-start with logged-in user's name
  // If reviewer set → go straight to step 2, 3, or 4
  const step = !reviewedBy ? 1
    : reviewStatus === "changes_needed" ? 3
    : reviewStatus === "changes_done" ? 4
    : 2;

  // Auto-start: if panel opens and no reviewer yet, immediately claim it
  // We do this by treating step 1 as just a confirmation button showing YOUR name
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-0" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">👁 Under Review — {urCase.client}</p>
            <p className="text-xs text-amber-100">{urCase.formType} · {urCase.id} · Assigned: {urCase.assignedTo || "Unassigned"}</p>
          </div>
          <button onClick={onClose} className="text-amber-100 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-100 bg-slate-50">
          {[{n:1,l:"Start"},{n:2,l:"Review"},{n:3,l:"Changes"},{n:4,l:"Submit"}].map(s => (
            <div key={s.n} className={`flex-1 py-2 text-center text-[10px] font-bold transition-colors ${step === s.n ? "text-amber-700 border-b-2 border-amber-500 bg-white" : step > s.n ? "text-emerald-600" : "text-slate-400"}`}>
              {step > s.n ? "✓ " : ""}{s.l}
            </div>
          ))}
        </div>

        <div className="p-4 space-y-3 max-h-[65vh] overflow-auto">

          {/* Step 1: Auto-assign reviewer as logged-in user */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-center">
                <p className="text-xs text-slate-500 mb-1">You are reviewing as</p>
                <p className="text-lg font-bold text-amber-800">{myName}</p>
              </div>
              <button onClick={async () => {
                onUpdate(urCase.id, { reviewedBy: myName, reviewStatus: "reviewing" });
                setCaseActionStatus("✅ You are now reviewing " + urCase.client);
                setTimeout(() => setCaseActionStatus(""), 3000);
              }} className="w-full rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700">
                👁 Start Reviewing
              </button>
            </div>
          )}

          {/* Step 2: Write changes */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2">
                <p className="text-xs font-bold text-amber-800">Reviewing as: {reviewedBy}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Will notify <strong>{urCase.assignedTo || "assigned staff"}</strong> when you send changes</p>
              </div>
              <p className="text-sm font-bold text-slate-700">What needs to be changed?</p>
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                placeholder="e.g. Passport copy is unclear, need employment letter page 2, fix date of birth field..."
                rows={5}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none resize-none" />
              <button onClick={async () => {
                const notes = notesValue.trim();
                if (!notes) { setCaseActionStatus("❌ Write what needs to be changed first"); return; }
                onUpdate(urCase.id, { reviewNotes: notes, reviewStatus: "changes_needed" });
                await onAddNote(urCase.id,
                  "⚠️ CHANGES NEEDED (by " + reviewedBy + "):\n" + notes,
                  reviewedBy
                );
                if (urCase.assignedTo && urCase.assignedTo !== "Unassigned") {
                  await onNotify(
                    urCase.assignedTo,
                    "⚠️ " + urCase.client + " (" + urCase.id + ") — Changes needed by " + reviewedBy + ": " + notes.slice(0, 100),
                    urCase.id
                  );
                }
                onClose();
                setCaseActionStatus("⚠️ Changes sent to " + (urCase.assignedTo || "staff"));
                setTimeout(() => setCaseActionStatus(""), 5000);
              }} className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">
                ⚠️ Send Changes to {urCase.assignedTo || "Assigned Staff"}
              </button>
              <button onClick={() => {
                onUpdate(urCase.id, { reviewStatus: "changes_done" });
                onClose();
                setCaseActionStatus("✅ Marked ready to submit");
                setTimeout(() => setCaseActionStatus(""), 3000);
              }} className="w-full rounded-xl border-2 border-emerald-200 bg-emerald-50 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                ✅ No Changes Needed — Ready to Submit
              </button>
            </div>
          )}

          {/* Step 3: Staff sees changes and marks done */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Reviewer: {reviewedBy}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">⚠️ Changes Needed</span>
              </div>
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3">
                <p className="text-xs font-bold text-red-700 mb-2">Changes required:</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{reviewNotes}</p>
              </div>
              <button onClick={async () => {
                onUpdate(urCase.id, { reviewStatus: "changes_done" });
                await onAddNote(urCase.id,
                  "✅ Changes done by " + myName + " — ready for re-review.",
                  myName
                );
                if (reviewedBy) {
                  await onNotify(
                    reviewedBy,
                    "✅ " + urCase.client + " (" + urCase.id + ") — Changes done by " + myName + ". Ready to submit.",
                    urCase.id
                  );
                }
                onClose();
                setCaseActionStatus("✅ Changes done — " + reviewedBy + " notified");
                setTimeout(() => setCaseActionStatus(""), 4000);
              }} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                ✅ Changes Done — Notify Reviewer
              </button>
              <button onClick={() => { onUpdate(urCase.id, { reviewStatus: "reviewing" }); onClose(); }}
                className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50">
                ✏️ Reviewer wants to update notes
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
              <p className="text-sm font-bold text-slate-700">Enter application number to submit</p>
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
