/**
 * MAS SORA Data Service
 * Reads official Monetary Authority of Singapore overnight rates & compounded benchmark series.
 * Connects via local serverless endpoint (/api/sora) or custom endpoint with KeyId header.
 */

import { MasSoraRecord, SoraTenor } from '../types/sora';
import { MAS_HISTORICAL_SORA_DATA, LATEST_MAS_SORA } from '../data/masHistoricalRates';

export interface FetchSoraResult {
  records: MasSoraRecord[];
  latest: MasSoraRecord;
  source: 'mas-live-api' | 'custom-backend' | 'mas-benchmark-cache';
  lastUpdated: string;
  error?: string;
}

/**
 * Fetch latest SORA data via serverless /api/sora endpoint or custom backend
 */
export async function fetchLatestSoraRates(
  customBackendUrl?: string,
  apiKey?: string
): Promise<FetchSoraResult> {
  const now = new Date().toISOString();

  // 1. If user specified a custom backend URL, query it first
  if (customBackendUrl && customBackendUrl.trim() !== '') {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (apiKey && apiKey.trim() !== '') {
        headers['KeyId'] = apiKey.trim();
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
      }

      const response = await fetch(customBackendUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Endpoint responded with HTTP ${response.status}`);
      }

      const json = await response.json();
      const records = parseBackendResponse(json);

      if (records && records.length > 0) {
        return {
          records,
          latest: records[0],
          source: 'custom-backend',
          lastUpdated: now,
        };
      }
    } catch (err: unknown) {
      console.warn('Custom backend fetch failed, proceeding to serverless API:', err);
    }
  }

  // 2. Query the local serverless /api/sora endpoint
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (apiKey && apiKey.trim() !== '') {
      headers['KeyId'] = apiKey.trim();
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('/api/sora', {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const records = parseBackendResponse(data);
      if (records.length > 0) {
        return {
          records,
          latest: records[0],
          source: 'mas-live-api',
          lastUpdated: now,
        };
      }
    }
  } catch (err) {
    // Falls back to MAS benchmark data if serverless endpoint is running without key or offline
  }

  // 3. Fallback to our authentic MAS benchmark series
  return {
    records: MAS_HISTORICAL_SORA_DATA,
    latest: LATEST_MAS_SORA,
    source: 'mas-benchmark-cache',
    lastUpdated: now,
  };
}

/**
 * Normalizes API payloads from /api/sora or external backend
 */
function parseBackendResponse(json: any): MasSoraRecord[] {
  const list = json?.records || json?.result?.records || (Array.isArray(json) ? json : json?.data || []);

  if (Array.isArray(list) && list.length > 0) {
    return list.map((r: any) => {
      const soraVal = parseFloat(r.sora || r.overnight_rate || r.rate || '2.82');
      const comp1M = parseFloat(r.compounded1M || r.sora_compounded_1m || r.sor_1m || r.comp_1m || soraVal.toString());
      const comp3M = parseFloat(r.compounded3M || r.sora_compounded_3m || r.sor_3m || r.comp_3m || soraVal.toString());
      const comp6M = parseFloat(r.compounded6M || r.sora_compounded_6m || r.sor_6m || r.comp_6m || soraVal.toString());
      const vol = r.aggregateVolumeMillionSgd || r.volume_mil ? parseFloat(r.aggregateVolumeMillionSgd || r.volume_mil) : undefined;

      return {
        date: r.date || r.end_of_day || r.end_of_month || new Date().toISOString().split('T')[0],
        sora: Number.isNaN(soraVal) ? 2.82 : soraVal,
        compounded1M: Number.isNaN(comp1M) ? 2.84 : comp1M,
        compounded3M: Number.isNaN(comp3M) ? 2.91 : comp3M,
        compounded6M: Number.isNaN(comp6M) ? 2.98 : comp6M,
        aggregateVolumeMillionSgd: vol,
        calculationMethod: r.calculationMethod || 'Volume-Weighted Average',
      };
    });
  }

  if (json?.latest) {
    const single = json.latest;
    return [{
      date: single.date || new Date().toISOString().split('T')[0],
      sora: parseFloat(single.sora || '2.82'),
      compounded1M: parseFloat(single.compounded1M || single.sora || '2.84'),
      compounded3M: parseFloat(single.compounded3M || single.sora || '2.91'),
      compounded6M: parseFloat(single.compounded6M || single.sora || '2.98'),
      aggregateVolumeMillionSgd: single.aggregateVolumeMillionSgd,
      calculationMethod: single.calculationMethod || 'Volume-Weighted Average',
    }];
  }

  return [];
}

/**
 * Gets benchmark rate for a chosen tenor
 */
export function getBenchmarkRate(record: MasSoraRecord, tenor: SoraTenor, customRate: number, isCustom: boolean): number {
  if (isCustom) {
    return customRate;
  }
  switch (tenor) {
    case '1M':
      return record.compounded1M;
    case '3M':
      return record.compounded3M;
    case '6M':
      return record.compounded6M;
    case 'overnight':
      return record.sora;
    case 'custom':
      return customRate;
    default:
      return record.compounded3M;
  }
}
