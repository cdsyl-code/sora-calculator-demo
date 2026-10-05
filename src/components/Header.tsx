import React from 'react';
import { Database, RefreshCw, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { BackendConfig } from '../types/sora';

interface HeaderProps {
  onOpenBackendConfig: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  dataSource: 'mas-live-api' | 'custom-backend' | 'mas-benchmark-cache';
  backendConfig: BackendConfig;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBackendConfig,
  onRefreshData,
  isRefreshing,
  dataSource,
  backendConfig,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              SG
            </div>
            <div>
              <a href="#" className="text-lg font-bold tracking-tight text-neutral-950 flex items-center gap-2">
                SORA Calculator
              </a>
            </div>
          </div>

          {/* Zone 2: Clean 4-6 text navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-neutral-600">
            <a href="#calculator" className="hover:text-neutral-950 transition-colors">
              Loan Calculator
            </a>
            <a href="#rates-benchmark" className="hover:text-neutral-950 transition-colors">
              MAS Benchmark
            </a>
            <a href="#schedule" className="hover:text-neutral-950 transition-colors">
              Amortization
            </a>
            <a href="#stress-test" className="hover:text-neutral-950 transition-colors">
              MAS Stress Test
            </a>
            <a href="#history" className="hover:text-neutral-950 transition-colors">
              Historical Trend
            </a>
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onRefreshData}
              disabled={isRefreshing}
              title="Refresh MAS benchmark rates"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Rates</span>
            </button>

            <button
              onClick={onOpenBackendConfig}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs transition-colors whitespace-nowrap cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-neutral-300" />
              <span>Backend API</span>
              {backendConfig.useCustomBackend && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
