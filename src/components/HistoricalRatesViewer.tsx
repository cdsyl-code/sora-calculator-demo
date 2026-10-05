import React, { useState } from 'react';
import { MasSoraRecord, SoraTenor } from '../types/sora';
import { ExternalLink, Calendar, HelpCircle, Check, ArrowRight } from 'lucide-react';

interface HistoricalRatesViewerProps {
  records: MasSoraRecord[];
  onApplyHistoricalRate: (record: MasSoraRecord) => void;
}

export const HistoricalRatesViewer: React.FC<HistoricalRatesViewerProps> = ({
  records,
  onApplyHistoricalRate,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'methodology'>('table');
  const [selectedRecordDate, setSelectedRecordDate] = useState<string>(records[0]?.date || '');

  // Calculate high, low, average across records
  const soraRates = records.map((r) => r.sora);
  const minSora = Math.min(...soraRates);
  const maxSora = Math.max(...soraRates);
  const avgSora = soraRates.reduce((a, b) => a + b, 0) / (soraRates.length || 1);

  return (
    <div id="history" className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">
            MAS SORA Benchmark History & Methodology
          </h3>
          <p className="text-xs text-neutral-500">
            Official Singapore Overnight Rate Average published daily at 9:00am SGT by MAS
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'table'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Historical Series
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('methodology')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'methodology'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            MAS Compounding Formula
          </button>
        </div>
      </div>

      {activeTab === 'table' ? (
        <div>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
              <span className="text-[11px] text-neutral-500 block">Period Low SORA</span>
              <span className="text-base font-semibold text-neutral-900 font-mono tabular-nums mt-0.5 block">
                {minSora.toFixed(4)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
              <span className="text-[11px] text-neutral-500 block">Period Average</span>
              <span className="text-base font-semibold text-neutral-900 font-mono tabular-nums mt-0.5 block">
                {avgSora.toFixed(4)}%
              </span>
            </div>
            <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/60">
              <span className="text-[11px] text-neutral-500 block">Period High SORA</span>
              <span className="text-base font-semibold text-neutral-900 font-mono tabular-nums mt-0.5 block">
                {maxSora.toFixed(4)}%
              </span>
            </div>
          </div>

          {/* Historical Table */}
          <div className="overflow-x-auto border border-neutral-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-medium">
                  <th className="py-2.5 px-3.5">Publication Date</th>
                  <th className="py-2.5 px-3.5 text-right">Overnight SORA</th>
                  <th className="py-2.5 px-3.5 text-right">1M Compounded</th>
                  <th className="py-2.5 px-3.5 text-right font-semibold text-neutral-900">
                    3M Compounded
                  </th>
                  <th className="py-2.5 px-3.5 text-right">6M Compounded</th>
                  <th className="py-2.5 px-3.5 text-right">Daily SGD Volume</th>
                  <th className="py-2.5 px-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
                {records.map((r) => {
                  const isSelected = selectedRecordDate === r.date;
                  return (
                    <tr
                      key={r.date}
                      className={`hover:bg-neutral-50/70 transition-colors ${
                        isSelected ? 'bg-neutral-50 font-medium' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5 font-sans font-medium text-neutral-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        {r.date}
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-neutral-700">
                        {r.sora.toFixed(4)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-neutral-700">
                        {r.compounded1M.toFixed(4)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-neutral-950 font-semibold">
                        {r.compounded3M.toFixed(4)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-neutral-700">
                        {r.compounded6M.toFixed(4)}%
                      </td>
                      <td className="py-2.5 px-3.5 text-right text-neutral-500">
                        {r.aggregateVolumeMillionSgd
                          ? `S$ ${(r.aggregateVolumeMillionSgd / 1000).toFixed(2)}B`
                          : '—'}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecordDate(r.date);
                            onApplyHistoricalRate(r);
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded transition-colors cursor-pointer"
                        >
                          Use Rate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MAS Methodology Explanation */
        <div className="mt-4 space-y-4 text-xs text-neutral-700 leading-relaxed">
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <h4 className="font-semibold text-sm text-neutral-900 mb-1">
              How SORA is Calculated by MAS
            </h4>
            <p>
              The Singapore Overnight Rate Average (SORA) is published by the Monetary Authority of Singapore (MAS) at 9:00am SGT on every Singapore business day. It is the volume-weighted average rate of all unsecured overnight SGD interbank transactions brokered in Singapore between 8:00am and 6:15pm.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <h4 className="font-semibold text-sm text-neutral-900 mb-1">
              Compounded SORA Formula
            </h4>
            <p className="mb-2">
              Compounded SORA is calculated by compounding daily overnight SORA rates over the relevant period (1-month, 3-month, or 6-month) according to the official MAS convention:
            </p>
            <div className="bg-white p-3 rounded-lg border border-neutral-200 font-mono text-xs text-neutral-900 overflow-x-auto">
              Compounded Rate = [ Product_{'{i=1}'}^d (1 + (r_i × n_i) / 365) - 1 ] × (365 / d)
            </div>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-neutral-600">
              <li><strong>d</strong>: Total number of calendar days in the compounding period.</li>
              <li><strong>r_i</strong>: SORA published by MAS on business day i.</li>
              <li><strong>n_i</strong>: Number of calendar days for which rate r_i applies (e.g., 3 days on Friday across the weekend).</li>
              <li><strong>365</strong>: Day count convention standard for Singapore financial markets.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <h4 className="font-semibold text-sm text-neutral-900 mb-1">
              Compounding in Advance vs Compounding in Arrears
            </h4>
            <p>
              Most Singapore consumer mortgage packages (DBS, OCBC, UOB) utilize <strong>Compounded in Advance</strong>, where the interest rate for the upcoming payment cycle is determined upfront based on the published MAS compounded SORA on the fixing date. This allows borrowers to know their exact monthly installment in advance.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
