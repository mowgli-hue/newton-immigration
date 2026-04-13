"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InvitePayload = {
  invite: { token: string; status: string; email?: string; expiresAt: string };
  company: { id: string; name: string; slug: string };
  case: { id: string; formType: string; stage: string; retainerSigned: boolean };
};

export default function InvitePage({ params }: { params: { token: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState<InvitePayload | null>(null);
  const [name, setName] = useState("");
  const supportPhone = "6049024500";
  const supportEmail = "newtonimmigration@gmail.com";

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/invites/${params.token}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!mounted) return;
      if (!res.ok) {
        setError(String(body.error || "This invite link is no longer available."));
        setLoading(false);
        return;
      }
      setPayload(body as InvitePayload);
      setLoading(false);
    }
    void load();
    return () => { mounted = false; };
  }, [params.token]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invites/${params.token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(body.error || "Could not open portal. Please try again."));
        return;
      }
      const slug = String(body?.company?.slug || "");
      router.push(slug ? `/portal/${slug}?client=1&t=${encodeURIComponent(params.token)}` : "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span className="text-sm font-medium">Loading your portal...</span>
            </div>
          </div>
        )}

        {!loading && payload && (
          <div className="rounded-3xl border border-white/10 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-700 px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl">🏛️</div>
              <h1 className="text-xl font-bold text-white">Newton Immigration</h1>
              <p className="mt-1 text-sm text-slate-300">Secure Client Portal</p>
            </div>
            <div className="px-8 py-8">
              <div className="mb-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Your Application</p>
                <p className="text-base font-bold text-slate-900">{payload.case.formType}</p>
                <p className="text-xs text-slate-500 mt-0.5">Case {payload.case.id}</p>
              </div>
              <div className="mb-6 space-y-3">
                {[
                  { icon: "📝", text: "Review & sign your retainer agreement" },
                  { icon: "📋", text: "Answer a few quick questions" },
                  { icon: "📎", text: "Upload your documents securely" },
                  { icon: "✅", text: "Newton team handles the rest" },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-lg">{step.icon}</span>
                    <p className="text-sm text-slate-700">{step.text}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 mb-1.5">Your Name (optional)</label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none"
                    placeholder="Enter your full name" />
                </div>
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                    <p className="text-xs font-semibold text-red-700">{error}</p>
                  </div>
                )}
                <button disabled={submitting || payload.invite.status === "expired"}
                  className="w-full rounded-xl bg-slate-900 px-4 py-4 text-sm font-bold text-white hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit">
                  {payload.invite.status === "expired" ? "⚠️ Link Expired — Contact Newton" : submitting ? "Opening your portal..." : "Open My Portal →"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-slate-400">Secure & private · Your data is protected</p>
            </div>
          </div>
        )}

        {!loading && !payload && (
          <div className="rounded-3xl border border-white/10 bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-900 to-red-700 px-8 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl">🔒</div>
              <h1 className="text-xl font-bold text-white">Link Not Available</h1>
              <p className="mt-1 text-sm text-red-200">This portal link has expired or is invalid</p>
            </div>
            <div className="px-8 py-8 space-y-4">
              <p className="text-sm text-slate-600 text-center">Please contact Newton Immigration to get a new secure link.</p>
              <a href={`https://wa.me/${supportPhone}?text=Hi, I need a new portal link for my immigration case.`} target="_blank"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-600 px-4 py-4 text-sm font-bold text-white hover:bg-emerald-700">
                📱 WhatsApp Newton Immigration
              </a>
              <a href={`tel:${supportPhone}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                📞 Call {supportPhone}
              </a>
              <a href={`mailto:${supportEmail}?subject=Request New Portal Link`}
                className="flex items-center justify-center gap-2 w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50">
                ✉️ Email Us
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
