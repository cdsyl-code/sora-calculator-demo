import React, { useState } from 'react';
import { BackendConfig } from '../types/sora';
import { X, Server, CheckCircle2, AlertCircle, Copy, Check, Code2 } from 'lucide-react';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onSaveConfig: (newConfig: BackendConfig) => void;
  onTestConnection: (url: string, apiKey?: string) => Promise<boolean>;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
}) => {
  const [backendUrl, setBackendUrl] = useState(config.backendUrl || '/api/sora');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [useCustomBackend, setUseCustomBackend] = useState(config.useCustomBackend);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const ok = await onTestConnection(backendUrl, apiKey);
      if (ok) {
        setTestResult({
          success: true,
          message: 'Successfully reached endpoint and parsed MAS SORA records.',
        });
      } else {
        setTestResult({
          success: false,
          message: 'Endpoint returned no records or KeyId is invalid. Using MAS benchmark fallback.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      ...config,
      backendUrl,
      apiKey,
      useCustomBackend,
    });
    onClose();
  };

  const sampleJsonSchema = `{
  "success": true,
  "source": "mas-apimg-gw",
  "records": [
    {
      "date": "2026-10-02",
      "sora": 2.8200,
      "compounded1M": 2.8450,
      "compounded3M": 2.9120,
      "compounded6M": 2.9850
    }
  ]
}`;

  const sampleNodeSnippet = `// Serverless function (/api/sora.ts) connecting to MAS APIMG-GW:
// Header required: KeyId: <MAS_KEY_ID>
const MAS_ENDPOINT = 'https://eservices.mas.gov.sg/apimg-gw/server/monthly_statistical_bulletin_non610ora/interest_rates_of_banks_and_finance_companies_monthly/views/interest_rates_of_banks_and_finance_companies_monthly';

const response = await fetch(MAS_ENDPOINT, {
  headers: {
    'KeyId': process.env.MAS_KEY_ID,
    'Accept': 'application/json'
  }
});
const data = await response.json();`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-neutral-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-neutral-800" />
            <div>
              <h3 className="text-base font-semibold text-neutral-950">
                Backend API Integration
              </h3>
              <p className="text-xs text-neutral-500">
                Hook in your backend service when ready to serve live MAS overnight rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-neutral-700">
          {/* Toggle Custom Backend */}
          <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
            <div>
              <span className="font-semibold text-neutral-900 block text-sm">
                Enable Custom Backend Endpoint
              </span>
              <span className="text-neutral-500 text-xs">
                When enabled, the frontend will query your backend before falling back to MAS cache.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustomBackend}
                onChange={(e) => setUseCustomBackend(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900"></div>
            </label>
          </div>

          {/* Endpoint Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-900 mb-1">
                Backend API URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="/api/mas-sora or https://your-server.com/api/sora"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-900 mb-1">
                Authorization Header (Optional Bearer / Token)
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Optional API key or Bearer token"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-xs font-mono outline-hidden focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              />
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting}
                className="px-3.5 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isTesting ? 'Testing Connection...' : 'Test Connection'}
              </button>

              {testResult && (
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    testResult.success ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* Expected Response Format */}
          <div className="pt-3 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900">
                <Code2 className="w-4 h-4 text-neutral-700" />
                <span>Expected JSON Response Schema</span>
              </div>
              <button
                onClick={() => copyToClipboard(sampleJsonSchema)}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy Schema'}</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto">
              {sampleJsonSchema}
            </pre>
          </div>

          {/* Sample Backend Implementation */}
          <div className="pt-2 border-t border-neutral-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-neutral-900">Sample Node.js Backend Route</span>
              <button
                onClick={() => copyToClipboard(sampleNodeSnippet)}
                className="inline-flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Code</span>
              </button>
            </div>
            <pre className="p-3 bg-neutral-950 text-neutral-200 rounded-xl font-mono text-[11px] overflow-x-auto leading-relaxed">
              {sampleNodeSnippet}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-200/80 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
