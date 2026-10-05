/**
 * Singapore SORA Mortgage & Interest Rate Calculator
 * Monetary Authority of Singapore (MAS) Benchmark Engine
 */

import React, { useState, useEffect, useMemo } from 'react';
import { MasSoraRecord, SoraTenor, LoanInputParams, BackendConfig } from './types/sora';
import { MAS_HISTORICAL_SORA_DATA, LATEST_MAS_SORA } from './data/masHistoricalRates';
import {
  fetchLatestSoraRates,
  getBenchmarkRate,
} from './services/masSoraService';
import {
  calculateLoanDetails,
  generateMonthlySchedule,
  generateAnnualSchedule,
} from './utils/soraCalculator';

import { Header } from './components/Header';
import { RateTicker } from './components/RateTicker';
import { CalculatorInputs } from './components/CalculatorInputs';
import { SummaryCards } from './components/SummaryCards';
import { AmortizationChart } from './components/AmortizationChart';
import { AmortizationTable } from './components/AmortizationTable';
import { StressTestAndSensitivity } from './components/StressTestAndSensitivity';
import { HistoricalRatesViewer } from './components/HistoricalRatesViewer';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { Info, RotateCcw, ShieldCheck, HelpCircle } from 'lucide-react';

const DEFAULT_LOAN_PARAMS: LoanInputParams = {
  loanAmount: 750000,
  tenureYears: 25,
  selectedTenor: '3M',
  customSoraRate: 2.80,
  isCustomRateActive: false,
  spread: 0.65,
  propertyType: 'hdb',
  monthlyIncome: 12000,
  otherMonthlyDebts: 600,
  fixedComparisonRate: 3.00,
  stressFloorRate: 4.00,
};

const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  backendUrl: '/api/sora',
  useCustomBackend: false,
  syncStatus: 'idle',
};

export default function App() {
  const [records, setRecords] = useState<MasSoraRecord[]>(MAS_HISTORICAL_SORA_DATA);
  const [latestRecord, setLatestRecord] = useState<MasSoraRecord>(LATEST_MAS_SORA);
  const [dataSource, setDataSource] = useState<'mas-live-api' | 'custom-backend' | 'mas-benchmark-cache'>('mas-benchmark-cache');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());

  // Backend Integration Modal State
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => {
    try {
      const saved = localStorage.getItem('sora_backend_config');
      return saved ? JSON.parse(saved) : DEFAULT_BACKEND_CONFIG;
    } catch {
      return DEFAULT_BACKEND_CONFIG;
    }
  });
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);

  // Loan parameters
  const [params, setParams] = useState<LoanInputParams>(() => {
    try {
      const saved = localStorage.getItem('sora_loan_params');
      return saved ? JSON.parse(saved) : DEFAULT_LOAN_PARAMS;
    } catch {
      return DEFAULT_LOAN_PARAMS;
    }
  });

  // Save changes to localStorage for user convenience
  useEffect(() => {
    try {
      localStorage.setItem('sora_loan_params', JSON.stringify(params));
    } catch (e) {
      // Ignore
    }
  }, [params]);

  useEffect(() => {
    try {
      localStorage.setItem('sora_backend_config', JSON.stringify(backendConfig));
    } catch (e) {
      // Ignore
    }
  }, [backendConfig]);

  // Load MAS rates on mount
  const loadRates = async (config = backendConfig) => {
    setIsRefreshing(true);
    try {
      const targetUrl = config.useCustomBackend ? config.backendUrl : undefined;
      const result = await fetchLatestSoraRates(targetUrl, config.apiKey);
      setRecords(result.records);
      setLatestRecord(result.latest);
      setDataSource(result.source);
      setLastUpdated(result.lastUpdated);
    } catch (err) {
      console.warn('Failed loading SORA rates:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  // Update params handler
  const handleParamChange = (updated: Partial<LoanInputParams>) => {
    setParams((prev) => ({ ...prev, ...updated }));
  };

  // Test backend connection callback
  const handleTestBackendConnection = async (url: string, apiKey?: string): Promise<boolean> => {
    try {
      const res = await fetchLatestSoraRates(url, apiKey);
      return res.records && res.records.length > 0;
    } catch {
      return false;
    }
  };

  // Apply a historical rate record directly
  const handleApplyHistoricalRate = (record: MasSoraRecord) => {
    setLatestRecord(record);
    setParams((prev) => ({
      ...prev,
      isCustomRateActive: false,
    }));
  };

  // Reset to default settings
  const handleResetDefaults = () => {
    setParams(DEFAULT_LOAN_PARAMS);
    setLatestRecord(MAS_HISTORICAL_SORA_DATA[0]);
  };

  // Current Benchmark Rate
  const currentBenchmarkRate = useMemo(() => {
    return getBenchmarkRate(
      latestRecord,
      params.selectedTenor,
      params.customSoraRate,
      params.isCustomRateActive
    );
  }, [latestRecord, params.selectedTenor, params.customSoraRate, params.isCustomRateActive]);

  // Loan Calculation Engine
  const calculationResult = useMemo(() => {
    return calculateLoanDetails(params, currentBenchmarkRate);
  }, [params, currentBenchmarkRate]);

  // Amortization Schedules
  const monthlySchedule = useMemo(() => {
    return generateMonthlySchedule(
      params.loanAmount,
      calculationResult.allInRate,
      params.tenureYears
    );
  }, [params.loanAmount, calculationResult.allInRate, params.tenureYears]);

  const annualSchedule = useMemo(() => {
    return generateAnnualSchedule(monthlySchedule);
  }, [monthlySchedule]);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* 1. Header (Strict Top Bar Contract) */}
      <Header
        onOpenBackendConfig={() => setIsBackendModalOpen(true)}
        onRefreshData={() => loadRates()}
        isRefreshing={isRefreshing}
        dataSource={dataSource}
        backendConfig={backendConfig}
      />

      {/* 2. Official MAS SORA Benchmark Ticker */}
      <RateTicker
        latestRecord={latestRecord}
        selectedTenor={params.selectedTenor}
        onSelectTenor={(tenor: SoraTenor) =>
          handleParamChange({ selectedTenor: tenor, isCustomRateActive: false })
        }
        dataSource={dataSource}
        lastUpdated={lastUpdated}
      />

      {/* 3. Main Workspace */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Context Intro / SORA Overview */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-neutral-100 text-neutral-800 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-neutral-950">
                Singapore Overnight Rate Average (SORA) Calculator
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                Calculates monthly repayments, compound interest accumulation, and regulatory affordability (TDSR 55% & MSR 30%) using MAS benchmark rates. Replaces deprecated SIBOR and SOR frameworks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* 4. Core Calculator Section: Inputs & Summary Cards */}
        <section id="calculator" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Loan Inputs */}
          <div className="lg:col-span-5">
            <CalculatorInputs
              params={params}
              onChange={handleParamChange}
              latestRecord={latestRecord}
              currentBenchmarkRate={currentBenchmarkRate}
            />
          </div>

          {/* Right Column: Key Results & MAS Affordability */}
          <div className="lg:col-span-7">
            <SummaryCards
              result={calculationResult}
              params={params}
              currentBenchmarkRate={currentBenchmarkRate}
            />
          </div>
        </section>

        {/* 5. Amortization Curve Chart */}
        <section>
          <AmortizationChart
            annualSchedule={annualSchedule}
            loanAmount={params.loanAmount}
          />
        </section>

        {/* 6. Regulatory Stress Test & Rate Sensitivity */}
        <section>
          <StressTestAndSensitivity
            result={calculationResult}
            params={params}
            onChange={handleParamChange}
          />
        </section>

        {/* 7. Detailed Amortization Table */}
        <section>
          <AmortizationTable
            annualSchedule={annualSchedule}
            monthlySchedule={monthlySchedule}
            loanAmount={params.loanAmount}
            tenureYears={params.tenureYears}
            allInRate={calculationResult.allInRate}
            monthlyPayment={calculationResult.monthlyPayment}
            totalInterest={calculationResult.totalInterest}
          />
        </section>

        {/* 8. Historical Series & MAS Compounding Methodology */}
        <section>
          <HistoricalRatesViewer
            records={records}
            onApplyHistoricalRate={handleApplyHistoricalRate}
          />
        </section>
      </main>

      {/* 9. Backend Integration Drawer / Modal */}
      <BackendIntegrationModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
        config={backendConfig}
        onSaveConfig={(newConfig) => {
          setBackendConfig(newConfig);
          loadRates(newConfig);
        }}
        onTestConnection={handleTestBackendConnection}
      />

      {/* 10. Clean Financial Footer */}
      <footer className="bg-white border-t border-neutral-200 mt-12 py-8 text-neutral-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900">SORA Calculator SG</span>
            <span>·</span>
            <span>Monetary Authority of Singapore (MAS) Benchmark Framework</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-neutral-400">
            <span>TDSR Cap: 55%</span>
            <span>·</span>
            <span>HDB MSR Cap: 30%</span>
            <span>·</span>
            <span>MAS Stress Floor: 4.00%</span>
            <span>·</span>
            <span>Day Count: 365 Days</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-3 text-[11px] text-neutral-400">
          Disclaimer: Figures are calculated for estimation and comparison purposes. Actual loan terms, rate reset schedules, and monthly deductions are determined by licensed financial institutions in Singapore according to their respective credit terms and MAS notices.
        </div>
      </footer>
    </div>
  );
}
