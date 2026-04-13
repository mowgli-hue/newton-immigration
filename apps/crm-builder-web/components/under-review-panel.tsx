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
  const [submitting, setSubmitting] = useState(false);
  const [selectedReviewer, setSelectedReviewer] = useState("");

  if (!caseId) return null;
  const urCase = cases.find(c => c.id === caseId);
  if (!urCase) return null;

  const reviewedBy = (urCase as any).reviewedBy || "";
  const reviewStatus = (urCase as any).reviewStatus || "";
  const reviewNotes = (urCase as any).reviewNotes || "";
  const myName = sessionUser?.name || "Reviewer";
  const myRole = sessionUser?.role || "";
  const isReviewer = myRole === "Reviewer" || myRole === "Admin" || myRole === "ProcessingLead";
  const isAssignedStaff = urCase.assignedTo && urCase.assignedTo === myName;

  // Reviewer options — all team members with reviewer-capable roles
  const reviewerOptions = teamUsers.filter(u =>
    u.active !== false &&
    ["Reviewer", "Admin", "ProcessingLead"].includes(u.role)
  ).map(u => u.name);

  // Step logic
  // Step 1: No reviewer yet → pick reviewer and claim
  // Step 2: Reviewer claimed → write notes / approve
  // Step 3: Changes needed → staff fixes
  // Step 4: Ready to submit → reviewer submits
  const step = !reviewedBy ? 1
    : reviewStatus === "changes_needed" ? 3
    : reviewStatus === "changes_done" ? 4
    : 2;

  const stepLabels = ["Claim", "Review", "Fix", "Submit"];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-0" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-white">👁 Under Review — {urCase.client}</p>
            <p className="text-xs text-amber-100">{urCase.formType} · {urCase.id} · Assigned: {urCase.assignedTo || "Unassigned"}</p>
          </div>
          <button onClick={onClose} className="text-amber-100 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Step indicator */}
        <div className="flex border-b border-slate-100">
          {stepLabels.map((l, i) => {
            const n = i + 1;
            const isActive = step === n;
            const isDone = step > n;
            return (
              <div key={n} className={`flex-1 py-2.5 text-center text-[10px] font-bold border-b-2 transition-colors ${isActive ? "text-amber-700 border-amber-500 bg-amber-50" : isDone ? "text-emerald-600 border-emerald-400 bg-emerald-50" : "text-slate-400 border-transparent bg-white"}`}>
                {isDone ? "✓ " : ""}{l}
              </div>
            );
          })}
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-auto">

          {/* STEP 1: Waiting for reviewer to claim */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                <p className="text-2xl mb-2">👁</p>
                <p className="text-sm font-bold text-amber-800">{urCase.client}</p>
                <p className="text-xs text-amber-600 mt-0.5">{urCase.formType} · Assigned to {urCase.assignedTo || "Unassigned"}</p>
                <p className="text-xs text-slate-500 mt-3">This case is ready for review</p>
              </div>

              {isReviewer ? (
                <>
                  <p className="text-xs font-semibold text-slate-600">Select your name to claim this case:</p>
                  <select
                    value={selectedReviewer || myName}
                    onChange={e => setSelectedReviewer(e.target.value)}
                    className="w-full rounded-xl border-2 border-amber-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:border-amber-400 focus:outline-none">
                    {teamUsers.filter(u => u.active !== false).map(u => (
                      <option key={u.name} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <button onClick={async () => {
                    const reviewer = selectedReviewer || myName;
                    onUpdate(urCase.id, { reviewedBy: reviewer, reviewStatus: "reviewing" });
                    await onAddNote(urCase.id, `👁 Case claimed for review by ${reviewer}`, reviewer);
                    setCaseActionStatus("✅ " + reviewer + " is now reviewing " + urCase.client);
                    setTimeout(() => setCaseActionStatus(""), 3000);
                  }} className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700">
                    👁 Claim & Start Reviewing
                  </button>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
                  <p className="text-xs font-semibold text-slate-600">⏳ Waiting for a reviewer to claim this case</p>
                  <p className="text-[11px] text-slate-400 mt-1">A reviewer will pick this up shortly</p>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Reviewer reviews — writes notes or marks ready */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-amber-800">👁 Reviewer: {reviewedBy}</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">Assigned staff: {urCase.assignedTo || "Unassigned"}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Reviewing</span>
              </div>

              {reviewNotes ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-bold text-slate-600 mb-1">Previous notes:</p>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{reviewNotes}</p>
                </div>
              ) : null}

              <p className="text-sm font-semibold text-slate-700">What needs to be changed?</p>
              <textarea
                value={notesValue}
                onChange={e => setNotesValue(e.target.value)}
                placeholder="e.g. Passport copy is unclear, need employment letter page 2, fix date of birth field..."
                rows={4}
                className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none resize-none" />

              {(reviewedBy === myName || isReviewer || myRole === "Admin") && (
                <>
                  <button onClick={async () => {
                    const notes = notesValue.trim();
                    if (!notes) { setCaseActionStatus("❌ Write what needs to be changed first"); setTimeout(() => setCaseActionStatus(""), 3000); return; }
                    onUpdate(urCase.id, { reviewNotes: notes, reviewStatus: "changes_needed" });
                    await onAddNote(urCase.id,
                      `⚠️ CHANGES NEEDED (by ${reviewedBy}):
${notes}`,
                      reviewedBy
                    );
                    if (urCase.assignedTo && urCase.assignedTo !== "Unassigned") {
                      await onNotify(
                        urCase.assignedTo,
                        `⚠️ ${urCase.client} (${urCase.id}) — Changes needed by ${reviewedBy}: ${notes.slice(0, 120)}`,
                        urCase.id
                      );
                    }
                    setNotesValue("");
                    onClose();
                    setCaseActionStatus(`⚠️ Changes sent to ${urCase.assignedTo || "staff"}`);
                    setTimeout(() => setCaseActionStatus(""), 5000);
                  }} className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600">
                    ⚠️ Send Changes to {urCase.assignedTo || "Assigned Staff"}
                  </button>

                  <button onClick={async () => {
                    onUpdate(urCase.id, { reviewStatus: "changes_done", reviewNotes: notesValue.trim() || reviewNotes });
                    await onAddNote(urCase.id, `✅ Case approved by ${reviewedBy} — ready to submit`, reviewedBy);
                    onClose();
                    setCaseActionStatus("✅ Marked ready to submit");
                    setTimeout(() => setCaseActionStatus(""), 3000);
                  }} className="w-full rounded-xl border-2 border-emerald-300 bg-emerald-50 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100">
                    ✅ Looks Good — Ready to Submit
                  </button>
                </>
              )}

              {/* Change reviewer option */}
              <details className="rounded-xl border border-slate-200 overflow-hidden">
                <summary className="px-3 py-2 text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50">🔄 Change Reviewer</summary>
                <div className="px-3 pb-3 pt-2 space-y-2">
                  <select
                    value={selectedReviewer || reviewedBy}
                    onChange={e => setSelectedReviewer(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none">
                    {teamUsers.filter(u => u.active !== false).map(u => (
                      <option key={u.name} value={u.name}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                  <button onClick={async () => {
                    const newReviewer = selectedReviewer || reviewedBy;
                    onUpdate(urCase.id, { reviewedBy: newReviewer });
                    await onAddNote(urCase.id, `🔄 Reviewer changed to ${newReviewer} by ${myName}`, myName);
                    onClose();
                    setCaseActionStatus(`✅ Reviewer changed to ${newReviewer}`);
                    setTimeout(() => setCaseActionStatus(""), 3000);
                  }} className="w-full rounded-xl bg-slate-700 py-2 text-xs font-bold text-white hover:bg-slate-800">
                    Update Reviewer
                  </button>
                </div>
              </details>
            </div>
          )}

          {/* STEP 3: Staff sees changes needed and marks done */}
          {step === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">👁 Reviewer: {reviewedBy}</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">⚠️ Changes Needed</span>
              </div>

              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3">
                <p className="text-xs font-bold text-red-700 mb-2">Required changes:</p>
                <p className="text-sm text-slate-800 whitespace-pre-wrap">{reviewNotes}</p>
              </div>

              {(isAssignedStaff || myRole === "Admin" || myRole === "ProcessingLead") && (
                <button onClick={async () => {
                  onUpdate(urCase.id, { reviewStatus: "changes_done" });
                  await onAddNote(urCase.id,
                    `✅ Changes completed by ${myName} — ready for re-review`,
                    myName
                  );
                  if (reviewedBy) {
                    await onNotify(
                      reviewedBy,
                      `✅ ${urCase.client} (${urCase.id}) — Changes done by ${myName}. Please review and submit.`,
                      urCase.id
                    );
                  }
                  onClose();
                  setCaseActionStatus(`✅ Changes done — ${reviewedBy} notified`);
                  setTimeout(() => setCaseActionStatus(""), 4000);
                }} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
                  ✅ Changes Done — Notify Reviewer
                </button>
              )}

              {(reviewedBy === myName || isReviewer) && (
                <>
                  <p className="text-xs font-semibold text-slate-600">Update notes (reviewer):</p>
                  <textarea
                    value={notesValue}
                    onChange={e => setNotesValue(e.target.value)}
                    placeholder="Update or add more details..."
                    rows={3}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none resize-none" />
                  <button onClick={async () => {
                    const notes = notesValue.trim();
                    if (!notes) return;
                    onUpdate(urCase.id, { reviewNotes: notes });
                    await onAddNote(urCase.id, `📝 Notes updated by ${myName}:
${notes}`, myName);
                    setNotesValue("");
                    onClose();
                    setCaseActionStatus("✅ Notes updated");
                    setTimeout(() => setCaseActionStatus(""), 3000);
                  }} className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-700 hover:bg-amber-100">
                    📝 Update Notes
                  </button>
                </>
              )}
            </div>
          )}

          {/* STEP 4: Reviewer submits */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">👁 Reviewer: {reviewedBy}</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">✅ Ready to Submit</span>
              </div>

              {reviewNotes ? (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-bold text-slate-600 mb-1">Review notes:</p>
                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{reviewNotes}</p>
                </div>
              ) : null}

              {(reviewedBy === myName || isReviewer) ? (
                <>
                  <p className="text-sm font-semibold text-slate-700">Enter application number to submit:</p>
                  <input
                    value={appNum || (urCase as any).applicationNumber || ""}
                    onChange={e => setAppNum(e.target.value)}
                    placeholder="e.g. W311024778"
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm font-mono focus:border-emerald-400 focus:outline-none" />
                  <button onClick={async () => {
                    const num = (appNum || (urCase as any).applicationNumber || "").trim().toUpperCase();
                    if (!num) { setCaseActionStatus("❌ Enter application number"); return; }
                    setSubmitting(true);
                    await onSubmit(urCase.id, num);
                    setSubmitting(false);
                    onClose();
                  }} disabled={submitting} className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {submitting ? "Submitting..." : "🚀 Submit Application"}
                  </button>
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-center">
                  <p className="text-xs text-slate-500">Waiting for {reviewedBy} to submit</p>
                </div>
              )}

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
