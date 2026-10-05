/**
 * Health Check Serverless Endpoint
 * Route: /api/health
 */

import type { IncomingMessage, ServerResponse } from 'http';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  service: string;
  environment: string;
  hasMasKeyId: boolean;
  version: string;
}

/**
 * Core handler logic returning structured health info
 */
export function getHealthStatus(): HealthResponse {
  const hasMasKeyId = Boolean(process.env.MAS_KEY_ID && process.env.MAS_KEY_ID.trim().length > 0);

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'sora-mas-serverless-api',
    environment: process.env.NODE_ENV || 'development',
    hasMasKeyId,
    version: '1.0.0',
  };
}

/**
 * Standard Node.js / Express / Vercel Serverless Function handler
 */
export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const data = getHealthStatus();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(data, null, 2));
}

/**
 * Web standard Request/Response handler (Edge runtimes / Cloudflare / modern frameworks)
 */
export async function GET(_request?: Request): Promise<Response> {
  const data = getHealthStatus();

  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
