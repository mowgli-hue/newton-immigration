import { AIAdvisorChat } from "@/components/ai-chat";

export default function AIAdvisorPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Newton Immigration AI Advisor</h1>
      <p className="mt-3 text-sm text-newton-dark/75">Ask practical immigration questions and get guided pathway suggestions.</p>
      <div className="mt-6">
        <AIAdvisorChat />
      </div>
    </section>
  );
}
