import { CaseItem, sampleCases, stageOrder } from "@/lib/data";

type PipelineBoardProps = {
  cases?: CaseItem[];
};

export function PipelineBoard({ cases = sampleCases }: PipelineBoardProps) {
  const byStage = stageOrder.map((stage) => ({
    stage,
    count: cases.filter((item) => item.stage === stage).length
  }));

  return (
    <section className="space-y-4">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="text-xl font-semibold text-ink">Pipeline Board</h2>
        <p className="text-xs text-slate-500">Simple overview first, detailed actions below.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
        <p className="mb-3 text-sm font-medium text-slate-700">Stage Summary</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {byStage.map((item) => (
            <div key={item.stage} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <p className="text-xs text-slate-600">{item.stage}</p>
              <p className="text-lg font-semibold text-ink">{item.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft">
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-medium text-slate-700">Active Cases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Form</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">Due</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-ink">{item.id}</td>
                  <td className="px-4 py-3">{item.client}</td>
                  <td className="px-4 py-3">{item.formType}</td>
                  <td className="px-4 py-3">{item.stage}</td>
                  <td className="px-4 py-3">{item.owner}</td>
                  <td className="px-4 py-3">{item.dueInDays}d</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
