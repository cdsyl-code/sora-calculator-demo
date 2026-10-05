import React, { useState } from 'react';
import { AnnualAmortizationRow, AmortizationRow } from '../types/sora';
import { formatSGD, formatCurrencyDecimals, exportToCSV, exportToMarkdown } from '../utils/soraCalculator';
import { Download, ChevronRight, FileSpreadsheet, FileText } from 'lucide-react';

interface AmortizationTableProps {
  annualSchedule: AnnualAmortizationRow[];
  monthlySchedule: AmortizationRow[];
  loanAmount: number;
  tenureYears: number;
  allInRate: number;
  monthlyPayment: number;
  totalInterest: number;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  annualSchedule,
  monthlySchedule,
  loanAmount,
  tenureYears,
  allInRate,
  monthlyPayment,
  totalInterest,
}) => {
  const [viewMode, setViewMode] = useState<'annual' | 'monthly'>('annual');
  const [selectedYearFilter, setSelectedYearFilter] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleExportCSV = () => {
    exportToCSV(annualSchedule, loanAmount, tenureYears, allInRate);
  };

  const handleExportMarkdown = () => {
    exportToMarkdown(
      annualSchedule,
      loanAmount,
      tenureYears,
      allInRate,
      monthlyPayment,
      totalInterest
    );
  };

  const filteredMonthly = monthlySchedule.filter((row) => row.year === selectedYearFilter);

  return (
    <div id="schedule" className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">Amortization Schedule</h3>
          <p className="text-xs text-neutral-500">
            Payment breakdown showing principal paydown, interest allocation, and ending balances
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Annual vs Monthly View */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Annual Breakdown
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Monthly Breakdown
            </button>
          </div>

          {/* Export to Markdown Button */}
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Download full schedule and report as Markdown (.md)"
          >
            <FileText className="w-3.5 h-3.5 text-neutral-600" />
            <span>Export .md</span>
          </button>

          {/* Export to CSV Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Download spreadsheet in CSV format"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Monthly Filter Bar if Monthly View is Active */}
      {viewMode === 'monthly' && (
        <div className="flex items-center gap-2 py-3 border-b border-neutral-100 overflow-x-auto">
          <span className="text-xs font-medium text-neutral-600 shrink-0">Filter Year:</span>
          <div className="flex items-center gap-1">
            {annualSchedule.slice(0, 15).map((row) => (
              <button
                key={row.year}
                type="button"
                onClick={() => setSelectedYearFilter(row.year)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono tabular-nums transition-colors cursor-pointer ${
                  selectedYearFilter === row.year
                    ? 'bg-neutral-900 text-white font-semibold'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                Y{row.year}
              </button>
            ))}
            {annualSchedule.length > 15 && (
              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(Number(e.target.value))}
                className="text-xs py-1 px-2 rounded-md bg-neutral-100 border border-neutral-300 font-mono text-neutral-800 outline-hidden"
              >
                {annualSchedule.map((r) => (
                  <option key={r.year} value={r.year}>
                    Year {r.year}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}

      {/* Amortization Table */}
      <div className="mt-4 overflow-x-auto border border-neutral-200 rounded-xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600 font-medium">
              <th className="py-2.5 px-3.5 whitespace-nowrap">
                {viewMode === 'annual' ? 'Year' : 'Month / Year'}
              </th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Beginning Balance</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">
                {viewMode === 'annual' ? 'Total Payment' : 'Monthly Payment'}
              </th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-emerald-800">
                Principal Paid
              </th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-amber-800">
                Interest Paid
              </th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap">Ending Balance</th>
              <th className="py-2.5 px-3.5 text-right whitespace-nowrap text-neutral-500">
                Cumulative Interest
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 font-mono tabular-nums">
            {viewMode === 'annual' ? (
              annualSchedule.map((row) => (
                <tr key={row.year} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2.5 px-3.5 font-sans font-semibold text-neutral-900">
                    Year {row.year}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-neutral-700">
                    {formatCurrencyDecimals(row.beginningBalance)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right font-semibold text-neutral-900">
                    {formatCurrencyDecimals(row.totalPayment)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-emerald-700 font-medium">
                    {formatCurrencyDecimals(row.principalPaid)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-amber-700 font-medium">
                    {formatCurrencyDecimals(row.interestPaid)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-neutral-900 font-medium">
                    {formatCurrencyDecimals(row.endingBalance)}
                  </td>
                  <td className="py-2.5 px-3.5 text-right text-neutral-500">
                    {formatCurrencyDecimals(row.cumulativeInterest)}
                  </td>
                </tr>
              ))
            ) : (
              filteredMonthly.map((row) => (
                <tr key={row.month} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-2 px-3.5 font-sans font-medium text-neutral-800">
                    M{row.month} <span className="text-neutral-400 text-[10px]">(Yr {row.year})</span>
                  </td>
                  <td className="py-2 px-3.5 text-right text-neutral-700">
                    {formatCurrencyDecimals(row.beginningBalance)}
                  </td>
                  <td className="py-2 px-3.5 text-right font-semibold text-neutral-900">
                    {formatCurrencyDecimals(row.monthlyPayment)}
                  </td>
                  <td className="py-2 px-3.5 text-right text-emerald-700">
                    {formatCurrencyDecimals(row.principalPaid)}
                  </td>
                  <td className="py-2 px-3.5 text-right text-amber-700">
                    {formatCurrencyDecimals(row.interestPaid)}
                  </td>
                  <td className="py-2 px-3.5 text-right text-neutral-900">
                    {formatCurrencyDecimals(row.endingBalance)}
                  </td>
                  <td className="py-2 px-3.5 text-right text-neutral-500">
                    {formatCurrencyDecimals(row.cumulativeInterest)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
        <span>* Calculated using standard 365-day Singapore mortgage amortization convention.</span>
        <span>Showing {viewMode === 'annual' ? `${annualSchedule.length} Years` : `12 Months for Year ${selectedYearFilter}`}</span>
      </div>
    </div>
  );
};
