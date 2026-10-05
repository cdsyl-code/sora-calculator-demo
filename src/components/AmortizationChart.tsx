import React, { useState } from 'react';
import { AnnualAmortizationRow } from '../types/sora';
import { formatSGD } from '../utils/soraCalculator';

interface AmortizationChartProps {
  annualSchedule: AnnualAmortizationRow[];
  loanAmount: number;
}

export const AmortizationChart: React.FC<AmortizationChartProps> = ({
  annualSchedule,
  loanAmount,
}) => {
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'balance' | 'cumulative'>('balance');

  if (annualSchedule.length === 0) return null;

  const totalYears = annualSchedule.length;
  const maxRepaid = annualSchedule[annualSchedule.length - 1].cumulativeInterest + loanAmount;
  const maxVal = chartMode === 'balance' ? loanAmount : maxRepaid;

  // Chart dimensions
  const width = 800;
  const height = 260;
  const padding = { top: 20, right: 30, bottom: 35, left: 70 };
  const graphWidth = width - padding.left - padding.right;
  const graphHeight = height - padding.top - padding.bottom;

  // Calculate points
  const getX = (year: number) => padding.left + ((year - 1) / (totalYears - 1)) * graphWidth;
  const getY = (val: number) => padding.top + graphHeight - (val / maxVal) * graphHeight;

  // Paths
  const balancePoints = annualSchedule.map((d) => `${getX(d.year)},${getY(d.endingBalance)}`).join(' ');
  const balanceArea = `${padding.left},${getY(loanAmount)} ${balancePoints} ${padding.left + graphWidth},${padding.top + graphHeight} ${padding.left},${padding.top + graphHeight}`;

  const cumPrincipalPoints = annualSchedule.map((d) => `${getX(d.year)},${getY(loanAmount - d.endingBalance)}`).join(' ');
  const cumInterestPoints = annualSchedule.map((d) => `${getX(d.year)},${getY(d.cumulativeInterest)}`).join(' ');

  const activeRow = hoveredYear !== null
    ? annualSchedule.find((r) => r.year === hoveredYear) || annualSchedule[0]
    : annualSchedule[Math.min(4, annualSchedule.length - 1)];

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">Loan Amortization Trajectory</h3>
          <p className="text-xs text-neutral-500">Payoff progress, principal reduction, and interest burden over tenure</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setChartMode('balance')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === 'balance'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Balance Curve
          </button>
          <button
            type="button"
            onClick={() => setChartMode('cumulative')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              chartMode === 'cumulative'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Cumulative Interest
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="mt-4 relative overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredYear(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = padding.top + graphHeight * (1 - pct);
            const val = maxVal * pct;
            return (
              <g key={pct}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#f1f5f9"
                  strokeWidth="1"
                  strokeDasharray={pct === 0 ? 'none' : '3 3'}
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-neutral-400 font-mono"
                >
                  {formatSGD(val).replace('.00', '')}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {annualSchedule.map((d, i) => {
            if (i % Math.ceil(totalYears / 6) === 0 || i === totalYears - 1) {
              const x = getX(d.year);
              return (
                <text
                  key={d.year}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[10px] fill-neutral-500 font-mono"
                >
                  Yr {d.year}
                </text>
              );
            }
            return null;
          })}

          {chartMode === 'balance' ? (
            <>
              {/* Balance Area Fill */}
              <polygon points={balanceArea} fill="#f8fafc" />
              {/* Balance Line */}
              <polyline
                points={`${padding.left},${getY(loanAmount)} ${balancePoints}`}
                fill="none"
                stroke="#0f172a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          ) : (
            <>
              {/* Cumulative Principal */}
              <polyline
                points={`${padding.left},${getY(0)} ${cumPrincipalPoints}`}
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 2"
              />
              {/* Cumulative Interest */}
              <polyline
                points={`${padding.left},${getY(0)} ${cumInterestPoints}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Interactive vertical hover line and dots */}
          {hoveredYear !== null && (
            <g>
              <line
                x1={getX(hoveredYear)}
                y1={padding.top}
                x2={getX(hoveredYear)}
                y2={padding.top + graphHeight}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              {chartMode === 'balance' && activeRow && (
                <circle
                  cx={getX(hoveredYear)}
                  cy={getY(activeRow.endingBalance)}
                  r="5"
                  className="fill-neutral-900 stroke-white stroke-2"
                />
              )}
            </g>
          )}

          {/* Invisible interactive hover rects */}
          {annualSchedule.map((d) => (
            <rect
              key={d.year}
              x={getX(d.year) - graphWidth / (totalYears * 2)}
              y={padding.top}
              width={graphWidth / totalYears}
              height={graphHeight}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHoveredYear(d.year)}
            />
          ))}
        </svg>

        {/* Live Hover Readout Bar */}
        <div className="mt-3 pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3 text-xs bg-neutral-50/80 p-3 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">
              Year {activeRow.year} ({activeRow.year * 12} Mos):
            </span>
            <span className="text-neutral-500">
              Hover along graph to inspect any year
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
            <div>
              <span className="text-neutral-500 font-sans mr-1">Remaining Balance:</span>
              <span className="font-semibold text-neutral-950">
                {formatSGD(activeRow.endingBalance)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-sans mr-1">Principal Paid To Date:</span>
              <span className="font-semibold text-emerald-700">
                {formatSGD(loanAmount - activeRow.endingBalance)}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 font-sans mr-1">Cumulative Interest:</span>
              <span className="font-semibold text-amber-700">
                {formatSGD(activeRow.cumulativeInterest)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
