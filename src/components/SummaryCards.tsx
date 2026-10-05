import React from 'react';
import { CalculationResult, LoanInputParams } from '../types/sora';
import { formatSGD, formatCurrencyDecimals } from '../utils/soraCalculator';
import { ShieldCheck, AlertTriangle, XCircle, ArrowUpRight, Scale } from 'lucide-react';

interface SummaryCardsProps {
  result: CalculationResult;
  params: LoanInputParams;
  currentBenchmarkRate: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  result,
  params,
  currentBenchmarkRate,
}) => {
  const principalPercent = (params.loanAmount / result.totalPayment) * 100;
  const interestPercent = (result.totalInterest / result.totalPayment) * 100;

  return (
    <div className="space-y-4">
      {/* 1. Hero Payment Metric Card */}
      <div className="bg-neutral-950 text-white rounded-2xl p-6 shadow-sm border border-neutral-800">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <span className="text-xs font-medium uppercase tracking-wider text-neutral-400">
            Estimated Monthly Installment
          </span>
          <div className="flex items-center gap-1.5 text-xs text-neutral-300">
            <span>All-In Rate:</span>
            <span className="font-semibold text-emerald-400 font-mono tabular-nums text-sm">
              {result.allInRate.toFixed(4)}% p.a.
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold tracking-tight font-mono tabular-nums text-white">
              {formatSGD(result.monthlyPayment)}
            </span>
            <span className="text-sm text-neutral-400 font-sans">/ month</span>
          </div>

          <div className="text-xs text-neutral-400 font-mono tabular-nums">
            Exact: {formatCurrencyDecimals(result.monthlyPayment)}
          </div>
        </div>

        {/* Rate Composition Equation */}
        <div className="mt-4 pt-3 border-t border-neutral-800 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-300">
          <span className="text-neutral-400">Rate Formula:</span>
          <span className="font-mono text-neutral-200">
            SORA ({currentBenchmarkRate.toFixed(4)}%)
          </span>
          <span className="text-neutral-500">+</span>
          <span className="font-mono text-neutral-200">
            Bank Margin ({params.spread.toFixed(2)}%)
          </span>
          <span className="text-neutral-500">=</span>
          <span className="font-mono font-semibold text-emerald-400">
            {result.allInRate.toFixed(4)}%
          </span>
        </div>
      </div>

      {/* 2. Secondary Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Total Interest */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 block truncate">
            Total Interest Payable
          </span>
          <div className="text-xl font-bold text-neutral-950 font-mono tabular-nums mt-1">
            {formatSGD(result.totalInterest)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {interestPercent.toFixed(1)}% of total repayment
          </div>
        </div>

        {/* Total Repayment */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200">
          <span className="text-xs font-medium text-neutral-500 block truncate">
            Total Repayment Amount
          </span>
          <div className="text-xl font-bold text-neutral-950 font-mono tabular-nums mt-1">
            {formatSGD(result.totalPayment)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Loan: {formatSGD(params.loanAmount)}
          </div>
        </div>

        {/* First Year Interest */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
          <span className="text-xs font-medium text-neutral-500 block truncate">
            Year 1 Interest Paid
          </span>
          <div className="text-xl font-bold text-neutral-950 font-mono tabular-nums mt-1">
            {formatSGD(result.firstYearInterest)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            Principal reduced: {formatSGD(result.firstYearPrincipal)}
          </div>
        </div>
      </div>

      {/* 3. MAS Regulatory Check Card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-neutral-700" />
            <span className="text-xs font-semibold text-neutral-900">
              MAS Regulatory Affordability Rules
            </span>
          </div>
          <span className="text-[11px] text-neutral-500">
            Statutory Framework
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          {/* TDSR */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-neutral-700">
                TDSR (Max 55% Limit)
              </span>
              <span
                className={`text-xs font-semibold font-mono tabular-nums flex items-center gap-1 ${
                  result.tdsrStatus === 'pass'
                    ? 'text-emerald-700'
                    : result.tdsrStatus === 'warning'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {result.tdsrStatus === 'pass' && <ShieldCheck className="w-3.5 h-3.5" />}
                {result.tdsrStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                {result.tdsrStatus === 'fail' && <XCircle className="w-3.5 h-3.5" />}
                {result.tdsrRatio.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full ${
                  result.tdsrStatus === 'pass'
                    ? 'bg-emerald-600'
                    : result.tdsrStatus === 'warning'
                    ? 'bg-amber-500'
                    : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(100, (result.tdsrRatio / 55) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1.5">
              {result.tdsrStatus === 'pass'
                ? 'Within statutory debt limit.'
                : result.tdsrStatus === 'warning'
                ? 'Approaching 55% statutory limit.'
                : 'Exceeds MAS 55% maximum TDSR.'}
            </p>
          </div>

          {/* MSR (if HDB or EC) or Stress Test Indicator */}
          {params.propertyType === 'hdb' || params.propertyType === 'ec' ? (
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">
                  MSR (Max 30% HDB Limit)
                </span>
                <span
                  className={`text-xs font-semibold font-mono tabular-nums flex items-center gap-1 ${
                    result.msrStatus === 'pass'
                      ? 'text-emerald-700'
                      : result.msrStatus === 'warning'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                >
                  {result.msrStatus === 'pass' && <ShieldCheck className="w-3.5 h-3.5" />}
                  {result.msrStatus === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {result.msrStatus === 'fail' && <XCircle className="w-3.5 h-3.5" />}
                  {result.msrRatio ? `${result.msrRatio.toFixed(1)}%` : '0.0%'}
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full ${
                    result.msrStatus === 'pass'
                      ? 'bg-emerald-600'
                      : result.msrStatus === 'warning'
                      ? 'bg-amber-500'
                      : 'bg-red-600'
                  }`}
                  style={{ width: `${Math.min(100, ((result.msrRatio || 0) / 30) * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1.5">
                {result.msrStatus === 'pass'
                  ? 'Eligible under HDB/EC rules.'
                  : result.msrStatus === 'warning'
                  ? 'Approaching 30% ceiling.'
                  : 'Exceeds 30% MSR cap for HDB.'}
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-700">
                  MAS Stress Floor (4.00%)
                </span>
                <span className="text-xs font-semibold font-mono tabular-nums text-neutral-900">
                  {formatSGD(result.stressMonthlyPayment)}/mo
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Stress payment is +{formatSGD(result.stressPaymentDifference)} higher at 4.0% MAS regulatory rate.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
