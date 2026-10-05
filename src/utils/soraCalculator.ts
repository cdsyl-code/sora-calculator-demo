/**
 * SORA Financial Math & Singapore Regulatory Engine
 * Implements Singapore mortgage formulas, MAS TDSR (55%), MSR (30%),
 * and MAS medium-term regulatory stress testing (4.0% floor).
 */

import {
  LoanInputParams,
  CalculationResult,
  AmortizationRow,
  AnnualAmortizationRow,
} from '../types/sora';

export function formatSGD(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDecimals(amount: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercent(rate: number, decimals: number = 2): string {
  return `${rate.toFixed(decimals)}%`;
}

/**
 * Standard monthly mortgage installment formula (Equated Monthly Installment - EMI)
 * M = P * [ r(1+r)^N ] / [ (1+r)^N - 1 ]
 */
export function calculateMonthlyPayment(principal: number, annualRatePercent: number, tenureYears: number): number {
  if (principal <= 0 || tenureYears <= 0) return 0;
  if (annualRatePercent <= 0) {
    return principal / (tenureYears * 12);
  }

  const monthlyRate = annualRatePercent / 100 / 12;
  const totalMonths = tenureYears * 12;
  const factor = Math.pow(1 + monthlyRate, totalMonths);

  if (factor === 1 || Number.isNaN(factor)) {
    return principal / totalMonths;
  }

  return (principal * monthlyRate * factor) / (factor - 1);
}

/**
 * Performs complete loan calculations including MAS ratios and stress tests
 */
export function calculateLoanDetails(
  params: LoanInputParams,
  benchmarkRate: number
): CalculationResult {
  const allInRate = Math.max(0, benchmarkRate + params.spread);
  const totalMonths = params.tenureYears * 12;
  const monthlyPayment = calculateMonthlyPayment(params.loanAmount, allInRate, params.tenureYears);
  const totalPayment = monthlyPayment * totalMonths;
  const totalInterest = Math.max(0, totalPayment - params.loanAmount);

  // First year breakdown estimation
  const monthlyRate = allInRate / 100 / 12;
  let balance = params.loanAmount;
  let firstYearInterest = 0;
  let firstYearPrincipal = 0;

  for (let m = 1; m <= Math.min(12, totalMonths); m++) {
    const interestPart = balance * monthlyRate;
    const principalPart = monthlyPayment - interestPart;
    firstYearInterest += interestPart;
    firstYearPrincipal += principalPart;
    balance = Math.max(0, balance - principalPart);
  }

  // MAS TDSR (Total Debt Servicing Ratio) - Statutory ceiling: 55%
  const totalDebtObligations = monthlyPayment + (params.otherMonthlyDebts || 0);
  const tdsrRatio = params.monthlyIncome > 0
    ? (totalDebtObligations / params.monthlyIncome) * 100
    : 0;
  
  let tdsrStatus: 'pass' | 'warning' | 'fail' = 'pass';
  if (tdsrRatio > 55) {
    tdsrStatus = 'fail';
  } else if (tdsrRatio >= 50) {
    tdsrStatus = 'warning';
  }

  // MAS MSR (Mortgage Servicing Ratio for HDB & EC) - Statutory ceiling: 30%
  let msrRatio: number | undefined;
  let msrStatus: 'pass' | 'warning' | 'fail' | undefined;

  if (params.propertyType === 'hdb' || params.propertyType === 'ec') {
    msrRatio = params.monthlyIncome > 0
      ? (monthlyPayment / params.monthlyIncome) * 100
      : 0;
    if (msrRatio > 30) {
      msrStatus = 'fail';
    } else if (msrRatio >= 27) {
      msrStatus = 'warning';
    } else {
      msrStatus = 'pass';
    }
  }

  // MAS Medium-Term Regulatory Stress Test (e.g. 4.0% floor or all-in rate, whichever higher)
  const stressRate = Math.max(params.stressFloorRate, allInRate);
  const stressMonthlyPayment = calculateMonthlyPayment(params.loanAmount, stressRate, params.tenureYears);
  const stressPaymentDifference = stressMonthlyPayment - monthlyPayment;
  const stressTotalDebt = stressMonthlyPayment + (params.otherMonthlyDebts || 0);
  const stressTdsrRatio = params.monthlyIncome > 0 ? (stressTotalDebt / params.monthlyIncome) * 100 : 0;
  
  const stressTdsrStatus: 'pass' | 'warning' | 'fail' =
    stressTdsrRatio > 55 ? 'fail' : stressTdsrRatio >= 50 ? 'warning' : 'pass';

  // Comparison with Fixed Rate Mortgage
  const fixedMonthlyPayment = calculateMonthlyPayment(params.loanAmount, params.fixedComparisonRate, params.tenureYears);
  const fixedTotalPayment = fixedMonthlyPayment * totalMonths;
  const fixedTotalInterest = Math.max(0, fixedTotalPayment - params.loanAmount);
  const fixedMonthlySavings = fixedMonthlyPayment - monthlyPayment;

  return {
    allInRate,
    monthlyPayment,
    totalPayment,
    totalInterest,
    firstYearInterest,
    firstYearPrincipal,
    tdsrRatio,
    tdsrStatus,
    msrRatio,
    msrStatus,
    stressMonthlyPayment,
    stressPaymentDifference,
    stressTdsrRatio,
    stressTdsrStatus,
    fixedMonthlyPayment,
    fixedTotalInterest,
    fixedMonthlySavings,
  };
}

/**
 * Generates month-by-month amortization schedule
 */
export function generateMonthlySchedule(
  loanAmount: number,
  allInRatePercent: number,
  tenureYears: number
): AmortizationRow[] {
  const schedule: AmortizationRow[] = [];
  const totalMonths = tenureYears * 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, allInRatePercent, tenureYears);
  const monthlyRate = allInRatePercent / 100 / 12;

  let balance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const beginningBalance = balance;
    let interestPaid = beginningBalance * monthlyRate;
    let principalPaid = monthlyPayment - interestPaid;

    if (month === totalMonths || principalPaid > beginningBalance) {
      principalPaid = beginningBalance;
      interestPaid = Math.max(0, monthlyPayment - principalPaid);
      balance = 0;
    } else {
      balance = Math.max(0, beginningBalance - principalPaid);
    }

    cumulativeInterest += interestPaid;
    cumulativePrincipal += principalPaid;

    schedule.push({
      month,
      year: Math.ceil(month / 12),
      beginningBalance,
      monthlyPayment,
      principalPaid,
      interestPaid,
      endingBalance: balance,
      cumulativeInterest,
      cumulativePrincipal,
    });

    if (balance <= 0) break;
  }

  return schedule;
}

/**
 * Aggregates monthly schedule into annual view
 */
export function generateAnnualSchedule(monthlySchedule: AmortizationRow[]): AnnualAmortizationRow[] {
  const annualMap = new Map<number, AnnualAmortizationRow>();

  for (const row of monthlySchedule) {
    if (!annualMap.has(row.year)) {
      annualMap.set(row.year, {
        year: row.year,
        beginningBalance: row.beginningBalance,
        totalPayment: 0,
        principalPaid: 0,
        interestPaid: 0,
        endingBalance: row.endingBalance,
        cumulativeInterest: row.cumulativeInterest,
      });
    }

    const current = annualMap.get(row.year)!;
    current.totalPayment += row.monthlyPayment;
    current.principalPaid += row.principalPaid;
    current.interestPaid += row.interestPaid;
    current.endingBalance = row.endingBalance;
    current.cumulativeInterest = row.cumulativeInterest;
  }

  return Array.from(annualMap.values());
}

/**
 * Generates Rate Sensitivity Grid (-1.00% to +1.00%)
 */
export interface SensitivityRow {
  rateDelta: number; // e.g. -0.50
  adjustedRate: number; // in %
  monthlyPayment: number;
  monthlyDifference: number; // delta vs current
  annualDifference: number;
}

export function calculateSensitivityGrid(
  loanAmount: number,
  baseRatePercent: number,
  tenureYears: number
): SensitivityRow[] {
  const deltas = [-1.0, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1.0];
  const baseMonthly = calculateMonthlyPayment(loanAmount, baseRatePercent, tenureYears);

  return deltas.map((delta) => {
    const adjustedRate = Math.max(0.1, baseRatePercent + delta);
    const payment = calculateMonthlyPayment(loanAmount, adjustedRate, tenureYears);
    const monthlyDifference = payment - baseMonthly;
    return {
      rateDelta: delta,
      adjustedRate,
      monthlyPayment: payment,
      monthlyDifference,
      annualDifference: monthlyDifference * 12,
    };
  });
}

/**
 * Export Amortization Table to CSV format
 */
export function exportToCSV(
  rows: AnnualAmortizationRow[],
  loanAmount: number,
  tenureYears: number,
  rate: number
): void {
  const headers = [
    'Year',
    'Beginning Balance (SGD)',
    'Annual Payment (SGD)',
    'Principal Paid (SGD)',
    'Interest Paid (SGD)',
    'Ending Balance (SGD)',
    'Cumulative Interest (SGD)',
  ];

  const csvRows = [
    `# SORA Mortgage Amortization Schedule (MAS Benchmark)`,
    `# Loan Amount: SGD ${loanAmount.toLocaleString('en-SG')}`,
    `# Tenure: ${tenureYears} Years`,
    `# All-in Rate: ${rate.toFixed(4)}% p.a.`,
    `# Generated: ${new Date().toISOString().split('T')[0]}`,
    '',
    headers.join(','),
  ];

  for (const r of rows) {
    csvRows.push([
      r.year,
      r.beginningBalance.toFixed(2),
      r.totalPayment.toFixed(2),
      r.principalPaid.toFixed(2),
      r.interestPaid.toFixed(2),
      r.endingBalance.toFixed(2),
      r.cumulativeInterest.toFixed(2),
    ].join(','));
  }

  const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `SORA_Loan_Amortization_Schedule_${loanAmount}_${tenureYears}Y.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
