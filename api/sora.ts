/**
 * Monetary Authority of Singapore (MAS) SORA Serverless Endpoint
 * Route: /api/sora
 *
 * Compounded 1M/3M/6M averages MAS API:
 * https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/interest_rates_of_banks_and_finance_companies_monthly/views/interest_rates_of_banks_and_finance_companies_monthly
 *
 * Required Header for MAS:
 * KeyId: <MAS_KEY_ID>
 *
 * API Keys are NOT hardcoded. Configure via environment variable: MAS_KEY_ID
 */

import type { IncomingMessage, ServerResponse } from 'http';

const MAS_SORA_ENDPOINT =
  'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/interest_rates_of_banks_and_finance_companies_monthly/views/interest_rates_of_banks_and_finance_companies_monthly';

export interface NormalizedSoraRecord {
  date: string;
  sora: number;
  compounded1M: number;
  compounded3M: number;
  compounded6M: number;
  raw?: Record<string, unknown>;
}

export interface SoraApiResponse {
  success: boolean;
  message?: string;
  source: 'mas-apimg-gw' | 'error';
  timestamp: string;
  count?: number;
  latest?: NormalizedSoraRecord;
  records?: NormalizedSoraRecord[];
  raw?: unknown;
}

/**
 * Extracts MAS KeyId from process environment or incoming request headers
 */
function resolveMasKeyId(reqOrHeaders?: any): string {
  // 1. Process environment (recommended)
  const envKey = process.env.MAS_KEY_ID;
  if (envKey && envKey.trim().length > 0) {
    return envKey.trim();
  }

  // 2. Incoming request headers (KeyId, keyid, or x-mas-key-id)
  if (reqOrHeaders) {
    const headers = reqOrHeaders.headers || reqOrHeaders;
    const headerKey =
      (typeof headers.get === 'function' ? headers.get('keyid') || headers.get('KeyId') || headers.get('x-mas-key-id') : null) ||
      headers['keyid'] ||
      headers['KeyId'] ||
      headers['key-id'] ||
      headers['x-mas-key-id'];

    if (headerKey && typeof headerKey === 'string' && headerKey.trim().length > 0) {
      return headerKey.trim();
    }
  }

  return '';
}

/**
 * Normalizes MAS interest rate records into consistent SORA data models
 */
function normalizeMasRecords(rawItems: any[]): NormalizedSoraRecord[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item: any) => {
      // MAS monthly table fields typically include:
      // end_of_month / eom / date / year_month / month
      // sora_compounded_1m / sora_1m / sor_1m
      // sora_compounded_3m / sora_3m / sor_3m
      // sora_compounded_6m / sora_6m / sor_6m
      // sora_overnight / sora / overnight
      const dateStr =
        item.end_of_month ||
        item.eom ||
        item.end_of_day ||
        item.date ||
        item.month ||
        item.year_month ||
        new Date().toISOString().split('T')[0];

      const comp1M = parseFloat(
        item.sora_compounded_1m ??
        item.compounded_1m ??
        item.sor_1m ??
        item.sora_1m ??
        item.value_1m ??
        item.sora ??
        '0'
      );

      const comp3M = parseFloat(
        item.sora_compounded_3m ??
        item.compounded_3m ??
        item.sor_3m ??
        item.sora_3m ??
        item.value_3m ??
        item.sora ??
        '0'
      );

      const comp6M = parseFloat(
        item.sora_compounded_6m ??
        item.compounded_6m ??
        item.sor_6m ??
        item.sora_6m ??
        item.value_6m ??
        item.sora ??
        '0'
      );

      const overnightSora = parseFloat(
        item.sora ??
        item.overnight_rate ??
        item.sora_overnight ??
        item.rate ??
        comp3M.toString()
      );

      return {
        date: String(dateStr),
        sora: Number.isNaN(overnightSora) ? 0 : overnightSora,
        compounded1M: Number.isNaN(comp1M) ? 0 : comp1M,
        compounded3M: Number.isNaN(comp3M) ? 0 : comp3M,
        compounded6M: Number.isNaN(comp6M) ? 0 : comp6M,
        raw: item,
      };
    })
    .filter((r) => r.compounded3M > 0 || r.sora > 0 || r.compounded1M > 0);
}

/**
 * Core function fetching MAS SORA data
 */
export async function fetchMasSoraData(masKeyId: string): Promise<{ status: number; body: SoraApiResponse }> {
  const timestamp = new Date().toISOString();

  if (!masKeyId || masKeyId.trim() === '') {
    return {
      status: 401,
      body: {
        success: false,
        source: 'error',
        timestamp,
        message:
          'Missing MAS API Key. Please configure MAS_KEY_ID in your environment variables or provide KeyId in the request header.',
      },
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const masResponse = await fetch(MAS_SORA_ENDPOINT, {
      method: 'GET',
      headers: {
        'KeyId': masKeyId,
        'Accept': 'application/json',
        'User-Agent': 'SORA-Calculator-Serverless/1.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!masResponse.ok) {
      const errorText = await masResponse.text();
      return {
        status: masResponse.status,
        body: {
          success: false,
          source: 'error',
          timestamp,
          message: `MAS API responded with status ${masResponse.status}: ${masResponse.statusText}`,
          raw: errorText,
        },
      };
    }

    const data = await masResponse.json();

    // Extract records array from various MAS response envelopes
    const recordsArray = Array.isArray(data)
      ? data
      : Array.isArray(data?.result?.records)
      ? data.result.records
      : Array.isArray(data?.records)
      ? data.records
      : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.views)
      ? data.views
      : [];

    const normalized = normalizeMasRecords(recordsArray);

    return {
      status: 200,
      body: {
        success: true,
        source: 'mas-apimg-gw',
        timestamp,
        count: normalized.length,
        latest: normalized.length > 0 ? normalized[0] : undefined,
        records: normalized,
        raw: data,
      },
    };
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    return {
      status: 504,
      body: {
        success: false,
        source: 'error',
        timestamp,
        message: isAbort ? 'Gateway Timeout: MAS API did not respond within 8 seconds' : err.message || 'Error fetching MAS API',
      },
    };
  }
}

/**
 * Standard Node.js / Express / Vercel Serverless Function handler
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, KeyId, keyid, x-mas-key-id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const masKeyId = resolveMasKeyId(req);
  const { status, body } = await fetchMasSoraData(masKeyId);

  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
  res.end(JSON.stringify(body, null, 2));
}

/**
 * Web standard Request/Response handler (Edge runtimes / Cloudflare / modern frameworks)
 */
export async function GET(request: Request): Promise<Response> {
  const masKeyId = resolveMasKeyId(request);
  const { status, body } = await fetchMasSoraData(masKeyId);

  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800',
    },
  });
}
