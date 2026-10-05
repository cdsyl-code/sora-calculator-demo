import React from 'react';
import { LoanInputParams, SoraTenor, PropertyType, MasSoraRecord } from '../types/sora';
import { BANK_PACKAGE_PRESETS } from '../data/masHistoricalRates';
import { Building2, Home, Landmark, Sparkles, AlertCircle } from 'lucide-react';

interface CalculatorInputsProps {
  params: LoanInputParams;
  onChange: (updated: Partial<LoanInputParams>) => void;
  latestRecord: MasSoraRecord;
  currentBenchmarkRate: number;
}

export const CalculatorInputs: React.FC<CalculatorInputsProps> = ({
  params,
  onChange,
  latestRecord,
  currentBenchmarkRate,
}) => {
  const loanPresets = [
    { label: 'S$ 400K (HDB)', value: 400000 },
    { label: 'S$ 750K (BTO / Resale)', value: 750000 },
    { label: 'S$ 1.2M (Condo)', value: 1200000 },
    { label: 'S$ 2.0M (Prime / Landed)', value: 2000000 },
  ];

  const tenurePresets = [15, 20, 25, 30];

  const handlePresetSelect = (presetId: string) => {
    const selected = BANK_PACKAGE_PRESETS.find((p) => p.id === presetId);
    if (selected) {
      onChange({
        selectedTenor: selected.tenor,
        spread: selected.spreadYear1to2,
        isCustomRateActive: false,
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 p-5 lg:p-6 shadow-xs">
      <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
        <div>
          <h3 className="text-base font-semibold text-neutral-950">Loan Parameters</h3>
          <p className="text-xs text-neutral-500">Configure loan amount, SORA benchmark, and bank spread</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span>Benchmark:</span>
          <span className="font-semibold text-neutral-900 font-mono tabular-nums">
            {currentBenchmarkRate.toFixed(4)}%
          </span>
        </div>
      </div>

      <div className="space-y-5 mt-5">
        {/* 1. Loan Amount */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Loan Amount (SGD)
            </label>
            <span className="text-xs text-neutral-500 font-mono tabular-nums">
              S$ {params.loanAmount.toLocaleString('en-SG')}
            </span>
          </div>

          <div className="mt-2 relative rounded-lg border border-neutral-300 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900 overflow-hidden">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500 text-sm font-medium">
              S$
            </div>
            <input
              type="number"
              min={50000}
              max={20000000}
              step={10000}
              value={params.loanAmount}
              onChange={(e) => onChange({ loanAmount: Number(e.target.value) || 0 })}
              className="w-full pl-10 pr-4 py-2.5 text-sm font-semibold text-neutral-900 font-mono tabular-nums outline-hidden"
              placeholder="800,000"
            />
          </div>

          {/* Quick Amount Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2">
            {loanPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => onChange({ loanAmount: preset.value })}
                className={`py-1.5 px-2 text-xs rounded-md border text-center transition-colors cursor-pointer ${
                  params.loanAmount === preset.value
                    ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Loan Tenure */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Loan Tenure
            </label>
            <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums">
              {params.tenureYears} Years ({params.tenureYears * 12} Months)
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={35}
              step={1}
              value={params.tenureYears}
              onChange={(e) => onChange({ tenureYears: Number(e.target.value) })}
              className="w-full accent-neutral-900 h-2 bg-neutral-200 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 mt-2">
            {tenurePresets.map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => onChange({ tenureYears: years })}
                className={`flex-1 py-1 text-xs rounded-md border text-center transition-colors cursor-pointer ${
                  params.tenureYears === years
                    ? 'border-neutral-900 bg-neutral-900 text-white font-medium'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                {years} Yrs
              </button>
            ))}
          </div>
        </div>

        {/* 3. Benchmark Tenor Selection & Custom Rate */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              MAS SORA Benchmark Tenor
            </label>
            <button
              type="button"
              onClick={() => onChange({ isCustomRateActive: !params.isCustomRateActive })}
              className="text-xs text-neutral-600 hover:text-neutral-900 underline underline-offset-2 cursor-pointer"
            >
              {params.isCustomRateActive ? 'Use Official MAS Feed' : 'Simulate Custom Rate'}
            </button>
          </div>

          {params.isCustomRateActive ? (
            <div className="mt-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-amber-900">Custom SORA Simulation:</span>
                <span className="text-xs font-bold text-amber-900 font-mono tabular-nums">
                  {params.customSoraRate.toFixed(4)}% p.a.
                </span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  step={0.05}
                  min={0}
                  max={12}
                  value={params.customSoraRate}
                  onChange={(e) => onChange({ customSoraRate: Number(e.target.value) || 0 })}
                  className="w-full bg-white px-3 py-1.5 rounded-lg border border-amber-300 text-sm font-mono tabular-nums outline-hidden"
                />
                <span className="text-xs text-amber-800 shrink-0">% p.a.</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-1">
                Testing hypothetical rate fluctuation without changing official MAS benchmark records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {(['3M', '1M', '6M', 'overnight'] as SoraTenor[]).map((tenor) => {
                const label = tenor === 'overnight' ? 'Overnight' : `${tenor} SORA`;
                const rateVal =
                  tenor === '1M'
                    ? latestRecord.compounded1M
                    : tenor === '3M'
                    ? latestRecord.compounded3M
                    : tenor === '6M'
                    ? latestRecord.compounded6M
                    : latestRecord.sora;

                const isSelected = params.selectedTenor === tenor;
                return (
                  <button
                    key={tenor}
                    type="button"
                    onClick={() => onChange({ selectedTenor: tenor })}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                    }`}
                  >
                    <div className="text-[11px] font-medium leading-none truncate">{label}</div>
                    <div
                      className={`text-xs font-semibold font-mono tabular-nums mt-1 ${
                        isSelected ? 'text-white' : 'text-neutral-950'
                      }`}
                    >
                      {rateVal.toFixed(2)}%
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Bank Margin / Spread */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Bank Margin / Spread (% p.a.)
            </label>
            <span className="text-xs font-semibold text-neutral-900 font-mono tabular-nums">
              +{params.spread.toFixed(2)}% p.a.
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                step={0.01}
                min={0}
                max={5}
                value={params.spread}
                onChange={(e) => onChange({ spread: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-sm font-semibold text-neutral-900 font-mono tabular-nums rounded-lg border border-neutral-300 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 outline-hidden"
              />
              <span className="absolute right-3 top-2 text-xs text-neutral-500 font-mono">% p.a.</span>
            </div>
          </div>

          {/* Quick Bank Presets */}
          <div className="mt-2.5">
            <span className="text-[11px] text-neutral-500 block mb-1.5">Common Singapore Bank Packages:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {BANK_PACKAGE_PRESETS.slice(0, 3).map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => handlePresetSelect(bank.id)}
                  className={`px-2.5 py-1.5 rounded-lg border text-left transition-colors cursor-pointer text-xs ${
                    params.spread === bank.spreadYear1to2 && params.selectedTenor === bank.tenor
                      ? 'border-neutral-900 bg-neutral-100 font-medium text-neutral-950'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                  }`}
                >
                  <div className="font-medium truncate">{bank.bank}</div>
                  <div className="text-[10px] text-neutral-500 font-mono">
                    {bank.tenor} + {bank.spreadYear1to2.toFixed(2)}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 5. Property Type & MAS Affordability (TDSR / MSR) */}
        <div className="pt-2 border-t border-neutral-100">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-600 block mb-2">
            Property Type & Income (For TDSR & MSR)
          </label>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'hdb' as PropertyType, label: 'HDB Flat', sub: 'MSR 30% + TDSR 55%' },
              { id: 'ec' as PropertyType, label: 'Exec Condo', sub: 'MSR 30% + TDSR 55%' },
              { id: 'private' as PropertyType, label: 'Private Condo', sub: 'TDSR 55%' },
            ].map((prop) => (
              <button
                key={prop.id}
                type="button"
                onClick={() => onChange({ propertyType: prop.id })}
                className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                  params.propertyType === prop.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <div className="text-xs font-semibold">{prop.label}</div>
                <div className={`text-[10px] ${params.propertyType === prop.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {prop.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                Gross Monthly Income (SGD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-neutral-500">S$</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={params.monthlyIncome}
                  onChange={(e) => onChange({ monthlyIncome: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 focus:border-neutral-900 outline-hidden"
                  placeholder="12,000"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-600 block mb-1">
                Other Monthly Debts (Car, Cards)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-neutral-500">S$</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={params.otherMonthlyDebts}
                  onChange={(e) => onChange({ otherMonthlyDebts: Number(e.target.value) || 0 })}
                  className="w-full pl-8 pr-3 py-1.5 text-xs font-mono tabular-nums rounded-lg border border-neutral-300 focus:border-neutral-900 outline-hidden"
                  placeholder="800"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
