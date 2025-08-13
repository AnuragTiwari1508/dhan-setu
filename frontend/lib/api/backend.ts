// Helper functions to call the external Express backend so
// frontend stays in sync with persistent storage.
// Falls back to internal in-memory services if env vars are missing.

interface BackendConfig {
  baseUrl?: string;
  apiKey?: string;
  merchantId?: string;
}

export function getBackendConfig(): BackendConfig {
  return {
    baseUrl: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL,
    apiKey: process.env.MERCHANT_API_KEY,
    merchantId: process.env.MERCHANT_ID
  };
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, apiKey } = getBackendConfig();
  if (!baseUrl) throw new Error('Backend base URL not configured (NEXT_PUBLIC_BACKEND_URL)');
  const headers: Record<string,string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string,string> || {})
  };
  if (apiKey) headers['x-api-key'] = apiKey;
  return fetch(`${baseUrl}${path}`, { ...init, headers, cache: 'no-store' });
}

export async function createBackendPayment(body: any) {
  const res = await backendFetch('/api/payments/create', { method: 'POST', body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Backend payment create failed: ${res.status}`);
  return res.json();
}

export async function listBackendPayments(params: URLSearchParams) {
  const { merchantId } = getBackendConfig();
  if (!merchantId) throw new Error('MERCHANT_ID not set for listing payments');
  const query = params.toString();
  const res = await backendFetch(`/api/payments/merchant/${merchantId}${query ? `?${query}` : ''}`);
  if (!res.ok) throw new Error(`Backend payment list failed: ${res.status}`);
  return res.json();
}

export async function backendPaymentStats() {
  const { merchantId } = getBackendConfig();
  if (!merchantId) throw new Error('MERCHANT_ID not set for payment stats');
  const res = await backendFetch(`/api/payments/stats/${merchantId}`);
  if (!res.ok) throw new Error(`Backend payment stats failed: ${res.status}`);
  return res.json();
}
