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

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/invites/${params.token}`, { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!mounted) return;
      if (!res.ok) {
        setError(String(body.error || "Invite not found"));
        setLoading(false);
        return;
      }
      const data = body as InvitePayload;
      setPayload(data);
      setLoading(false);
    }
    void load();
    return () => {
      mounted = false;
    };
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
        setError(String(body.error || "Could not create account"));
        return;
      }
      const slug = String(body?.company?.slug || "");
      router.push(slug ? `/portal/${slug}` : "/");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-2xl items-center px-4 py-8">
      <section className="w-full rounded-2xl border-2 border-slate-300 bg-white p-6">
        {loading ? <p className="text-sm text-slate-600">Loading invite...</p> : null}

        {!loading && payload ? (
          <>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client Invite</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{payload.company.name} invited you</h1>
            <p className="mt-1 text-sm text-slate-600">
              Case {payload.case.id} • {payload.case.formType}
            </p>

            <div className="mt-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p>1. Open secure portal link (no login required)</p>
              <p>2. Review and e-sign retainer, complete Interac payment</p>
              <p>3. Upload documents and complete questions</p>
            </div>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm">
                <span className="text-xs font-medium text-slate-600">Full Name (optional)</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border-2 border-slate-300 px-3 py-2" placeholder="Client full name" />
              </label>

              {error ? <p className="text-xs text-red-600">{error}</p> : null}

              <button
                disabled={submitting || payload.invite.status === "expired"}
                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                type="submit"
              >
                {payload.invite.status === "expired"
                  ? "Invite Expired"
                  : submitting
                    ? "Opening Portal..."
                    : "Open Client Portal"}
              </button>
            </form>
          </>
        ) : null}

        {!loading && !payload ? <p className="text-sm text-red-600">{error || "Invalid invite link"}</p> : null}
      </section>
    </main>
  );
}
