/**
 * Singapore SORA Calculator - Data Models and Types
 * Monetary Authority of Singapore (MAS) Benchmark Specifications
 */

export type SoraTenor = 'overnight' | '1M' | '3M' | '6M' | 'custom';

export type PropertyType = 'hdb' | 'ec' | 'private' | 'commercial';

export interface MasSoraRecord {
  date: string; // YYYY-MM-DD
  sora: number; // Overnight SORA rate in % p.a.
  soraIndex?: number;
  compounded1M: number; // 1-month Compounded SORA in % p.a.
  compounded3M: number; // 3-month Compounded SORA in % p.a.
  compounded6M: number; // 6-month Compounded SORA in % p.a.
  aggregateVolumeMillionSgd?: number;
  calculationMethod?: 'Volume-Weighted Average' | 'Compounded in Advance';
}

export interface BankPackagePreset {
  id: string;
  name: string;
  bank: string;
  tenor: SoraTenor;
  spreadYear1to2: number; // e.g. 0.65
  spreadYear3Onwards: number; // e.g. 0.75
  lockInYears: number;
  description: string;
}

export interface LoanInputParams {
  loanAmount: number; // in SGD
  tenureYears: number; // 5 to 35
  selectedTenor: SoraTenor;
  customSoraRate: number; // in %
  isCustomRateActive: boolean;
  spread: number; // in % p.a. (e.g. 0.70)
  propertyType: PropertyType;
  monthlyIncome: number; // in SGD
  otherMonthlyDebts: number; // in SGD for TDSR
  fixedComparisonRate: number; // in % p.a. for comparing with fixed loan
  stressFloorRate: number; // MAS medium-term stress test floor (default 4.0%)
}

export interface AmortizationRow {
  month: number;
  year: number;
  beginningBalance: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AnnualAmortizationRow {
  year: number;
  beginningBalance: number;
  totalPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  cumulativeInterest: number;
}

export interface CalculationResult {
  allInRate: number; // Sora + spread
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  firstYearInterest: number;
  firstYearPrincipal: number;
  
  // MAS Regulatory Affordability
  tdsrRatio: number; // %
  tdsrStatus: 'pass' | 'warning' | 'fail';
  msrRatio?: number; // % (for HDB/EC)
  msrStatus?: 'pass' | 'warning' | 'fail';

  // Stress Test
  stressMonthlyPayment: number;
  stressPaymentDifference: number;
  stressTdsrRatio: number;
  stressTdsrStatus: 'pass' | 'warning' | 'fail';

  // Fixed Comparison
  fixedMonthlyPayment: number;
  fixedTotalInterest: number;
  fixedMonthlySavings: number; // positive if SORA is cheaper
}

export interface BackendConfig {
  backendUrl: string;
  useCustomBackend: boolean;
  apiKey?: string;
  lastSyncedAt?: string;
  syncStatus: 'idle' | 'loading' | 'success' | 'fallback' | 'error';
  errorMessage?: string;
}
