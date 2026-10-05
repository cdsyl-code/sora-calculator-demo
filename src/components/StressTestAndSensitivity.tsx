import React from 'react';
import { CalculationResult, LoanInputParams } from '../types/sora';
import { formatSGD, calculateSensitivityGrid } from '../utils/soraCalculator';
import { ShieldAlert, TrendingDown, TrendingUp, Sliders, ArrowRight } from 'lucide-react';

interface StressTestAndSensitivityProps {
  result: CalculationResult;
  params: LoanInputParams;
  onChange: (updated: Partial<LoanInputParams>) => void;
}

export const StressTestAndSensitivity: React.FC<StressTestAndSensitivityProps> = ({
  result,
  params,
  onChange,
}) => {
  const sensitivityRows = calculateSensitivityGrid(
    params.loanAmount,
    result.allInRate,
    params.tenureYears
  );

  return (
    <div id="stress-test" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. MAS Regulatory Stress Floor & Fixed Rate Comparison */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
            <ShieldAlert className="w-5 h-5 text-neutral-800" />
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                MAS Regulatory Stress Test (4.00% Floor)
              </h3>
              <p className="text-xs text-neutral-500">
                Mandatory MAS Notice 645 affordability stress buffer
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
              <span>Current All-In Rate:</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {result.allInRate.toFixed(4)}% p.a.
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
              <span>MAS Stress Rate Floor:</span>
              <span className="font-semibold text-neutral-900 font-mono">
                {params.stressFloorRate.toFixed(2)}% p.a.
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-200/80 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-medium text-neutral-700 block">
                  Stress Monthly Payment:
                </span>
                <span className="text-2xl font-bold font-mono text-neutral-950 tabular-nums">
                  {formatSGD(result.stressMonthlyPayment)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-neutral-500 block">Payment Buffer:</span>
                <span className="text-xs font-semibold text-amber-700 font-mono tabular-nums">
                  +{formatSGD(result.stressPaymentDifference)} / mo
                </span>
              </div>
            </div>

            <div className="mt-3 text-xs text-neutral-600 flex items-center justify-between bg-white p-2.5 rounded-lg border border-neutral-200/60">
              <span>Stress TDSR Ratio:</span>
              <span
                className={`font-semibold font-mono tabular-nums ${
                  result.stressTdsrStatus === 'pass'
                    ? 'text-emerald-700'
                    : result.stressTdsrStatus === 'warning'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {result.stressTdsrRatio.toFixed(1)}% (Cap: 55%)
              </span>
            </div>
          </div>

          {/* SORA vs Fixed Rate Comparison */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Compare with Fixed Rate Package
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step={0.05}
                  min={1}
                  max={10}
                  value={params.fixedComparisonRate}
                  onChange={(e) => onChange({ fixedComparisonRate: Number(e.target.value) || 0 })}
                  className="w-16 px-1.5 py-0.5 text-xs text-right font-mono border border-neutral-300 rounded outline-hidden"
                />
                <span className="text-xs text-neutral-500 font-mono">% p.a.</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl border border-neutral-200 bg-white">
                <span className="text-neutral-500 block">Fixed ({params.fixedComparisonRate.toFixed(2)}%)</span>
                <span className="text-base font-bold text-neutral-900 font-mono tabular-nums mt-0.5 block">
                  {formatSGD(result.fixedMonthlyPayment)}/mo
                </span>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  Total Interest: {formatSGD(result.fixedTotalInterest)}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-neutral-200 bg-white">
                <span className="text-neutral-500 block">SORA Floating ({result.allInRate.toFixed(2)}%)</span>
                <span className="text-base font-bold text-neutral-900 font-mono tabular-nums mt-0.5 block">
                  {formatSGD(result.monthlyPayment)}/mo
                </span>
                <span
                  className={`text-[11px] font-medium mt-1 block ${
                    result.fixedMonthlySavings >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {result.fixedMonthlySavings >= 0
                    ? `Save ${formatSGD(result.fixedMonthlySavings)}/mo on SORA`
                    : `Fixed is ${formatSGD(Math.abs(result.fixedMonthlySavings))}/mo cheaper`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Rate Sensitivity Table */}
      <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div>
            <h3 className="text-base font-semibold text-neutral-950">
              Interest Rate Sensitivity
            </h3>
            <p className="text-xs text-neutral-500">
              Impact of SORA market rate shifts on monthly repayments
            </p>
          </div>
          <span className="text-xs text-neutral-500 font-mono">
            Base: {result.allInRate.toFixed(2)}%
          </span>
        </div>

        <div className="mt-4 overflow-hidden border border-neutral-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-medium">
                <th className="py-2 px-3">SORA Shift</th>
                <th className="py-2 px-3 text-right">Adjusted Rate</th>
                <th className="py-2 px-3 text-right">Monthly Payment</th>
                <th className="py-2 px-3 text-right">Monthly Difference</th>
                <th className="py-2 px-3 text-right">Annual Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
              {sensitivityRows.map((row) => {
                const isBase = row.rateDelta === 0;
                return (
                  <tr
                    key={row.rateDelta}
                    className={`transition-colors ${
                      isBase ? 'bg-neutral-100/70 font-semibold' : 'hover:bg-neutral-50/60'
                    }`}
                  >
                    <td className="py-2 px-3 font-sans">
                      {isBase ? (
                        <span className="text-neutral-950 font-semibold">Current Rate</span>
                      ) : row.rateDelta > 0 ? (
                        <span className="text-red-700 flex items-center gap-0.5">
                          +{row.rateDelta.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-emerald-700 flex items-center gap-0.5">
                          {row.rateDelta.toFixed(2)}%
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-right text-neutral-800">
                      {row.adjustedRate.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-right font-semibold text-neutral-900">
                      {formatSGD(row.monthlyPayment)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right font-medium ${
                        isBase
                          ? 'text-neutral-500'
                          : row.monthlyDifference > 0
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isBase
                        ? '—'
                        : `${row.monthlyDifference > 0 ? '+' : ''}${formatSGD(row.monthlyDifference)}`}
                    </td>
                    <td
                      className={`py-2 px-3 text-right ${
                        isBase
                          ? 'text-neutral-500'
                          : row.annualDifference > 0
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {isBase
                        ? '—'
                        : `${row.annualDifference > 0 ? '+' : ''}${formatSGD(row.annualDifference)}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-[11px] text-neutral-500 mt-3">
          Tip: Each 0.25% (25 bps) shift in SORA alters monthly payments on this S$
          {(params.loanAmount / 1000).toFixed(0)}k loan by approximately{' '}
          {formatSGD(
            sensitivityRows.find((r) => r.rateDelta === 0.25)?.monthlyDifference || 100
          )}
          /month.
        </p>
      </div>
    </div>
  );
};
