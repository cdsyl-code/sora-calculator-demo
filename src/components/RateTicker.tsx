import React from 'react';
import { MasSoraRecord, SoraTenor } from '../types/sora';
import { ExternalLink, CheckCircle2, Server, Globe } from 'lucide-react';

interface RateTickerProps {
  latestRecord: MasSoraRecord;
  selectedTenor: SoraTenor;
  onSelectTenor: (tenor: SoraTenor) => void;
  dataSource: 'mas-live-api' | 'custom-backend' | 'mas-benchmark-cache';
  lastUpdated: string;
}

export const RateTicker: React.FC<RateTickerProps> = ({
  latestRecord,
  selectedTenor,
  onSelectTenor,
  dataSource,
}) => {
  const getSourceBadge = () => {
    switch (dataSource) {
      case 'mas-live-api':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
            <Globe className="w-3.5 h-3.5" />
            MAS Open Data API (Live)
          </span>
        );
      case 'custom-backend':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700">
            <Server className="w-3.5 h-3.5" />
            Custom Backend Integration
          </span>
        );
      case 'mas-benchmark-cache':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
            MAS Benchmark Data ({latestRecord.date})
          </span>
        );
    }
  };

  const rates = [
    {
      id: '3M' as SoraTenor,
      label: '3-Month Compounded SORA',
      rate: latestRecord.compounded3M,
      description: 'Standard Singapore bank mortgage benchmark',
      recommended: true,
    },
    {
      id: '1M' as SoraTenor,
      label: '1-Month Compounded SORA',
      rate: latestRecord.compounded1M,
      description: 'Faster tracking, resets monthly',
      recommended: false,
    },
    {
      id: '6M' as SoraTenor,
      label: '6-Month Compounded SORA',
      rate: latestRecord.compounded6M,
      description: 'Stable, resets semi-annually',
      recommended: false,
    },
    {
      id: 'overnight' as SoraTenor,
      label: 'Daily Overnight SORA',
      rate: latestRecord.sora,
      description: 'Published daily 9:00am SGT by MAS',
      recommended: false,
    },
  ];

  return (
    <div id="rates-benchmark" className="bg-white border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-neutral-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500">
                Official MAS SORA Benchmark
              </h2>
              <span className="text-neutral-300">·</span>
              {getSourceBadge()}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Published by the Monetary Authority of Singapore (MAS) for unsecured overnight SGD transactions.
              {latestRecord.aggregateVolumeMillionSgd && (
                <span> · Daily Volume: S${(latestRecord.aggregateVolumeMillionSgd / 1000).toFixed(2)}B</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <a
              href="https://www.mas.gov.sg/monetary-policy/sora"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <span>MAS Methodology & SORA Index</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Rate Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {rates.map((item) => {
            const isSelected = selectedTenor === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTenor(item.id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50/80 ring-1 ring-neutral-900'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-neutral-600 truncate max-w-[130px]">
                    {item.label}
                  </span>
                  {item.recommended && (
                    <span className="text-[10px] uppercase font-semibold text-neutral-900 bg-neutral-200/80 px-1.5 py-0.5 rounded">
                      Most Common
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold tracking-tight text-neutral-950 font-mono tabular-nums">
                    {item.rate.toFixed(4)}%
                  </span>
                  <span className="text-xs text-neutral-500 font-sans">p.a.</span>
                </div>

                <p className="mt-1 text-[11px] text-neutral-500 leading-tight">
                  {item.description}
                </p>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-200/80 flex items-center justify-between text-[11px] font-medium text-neutral-900">
                    <span>Applied to calculator</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
