import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

async function loadConfigModule(overrides: Record<string, string | undefined> = {}) {
  vi.unstubAllEnvs();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      vi.stubEnv(key, value);
    }
  }
  vi.resetModules();
  return import('./config');
}

describe('API migration configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe('API_BASE_URL', () => {
    it('defaults to the local FastAPI port in development', async () => {
      const { API_BASE_URL } = await loadConfigModule({ NODE_ENV: 'development' });
      expect(API_BASE_URL).toBe('http://localhost:9000');
    });

    it('honors NEXT_PUBLIC_FASTAPI_URL in development', async () => {
      const { API_BASE_URL } = await loadConfigModule({
        NODE_ENV: 'development',
        NEXT_PUBLIC_FASTAPI_URL: 'http://api.example:9000',
      });
      expect(API_BASE_URL).toBe('http://api.example:9000');
    });

    it('returns an empty base URL in production when FastAPI is not configured', async () => {
      const { API_BASE_URL } = await loadConfigModule({
        NODE_ENV: 'production',
        NEXT_PUBLIC_FASTAPI_URL: undefined,
      });
      delete process.env.NEXT_PUBLIC_FASTAPI_URL;
      expect(API_BASE_URL).toBe('');
    });

    it('uses NEXT_PUBLIC_FASTAPI_URL in production when configured', async () => {
      const { API_BASE_URL } = await loadConfigModule({
        NODE_ENV: 'production',
        NEXT_PUBLIC_FASTAPI_URL: 'https://api.camilo.dev',
      });
      expect(API_BASE_URL).toBe('https://api.camilo.dev');
    });
  });

  describe('API_ENDPOINTS migration map', () => {
    it('keeps legacy Next.js routes mapped beside FastAPI endpoints', async () => {
      const { API_ENDPOINTS } = await loadConfigModule();

      expect(API_ENDPOINTS.LEGACY.WHOOP_COLLECTOR_V2).toBe('/api/whoop-collector-v2');
      expect(API_ENDPOINTS.INTEGRATIONS.WHOOP_COLLECT).toBe('/api/integrations/whoop/collect');
      expect(API_ENDPOINTS.AI.CHAT_QUERY).toBe('/api/ai/chat/query');
    });
  });
});

describe('ApiClient migration helpers', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_FASTAPI_URL', 'http://localhost:9000');
    vi.resetModules();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  async function loadApiClient() {
    const mod = await import('./config');
    return mod.ApiClient;
  }

  it('requests the FastAPI backend and parses JSON responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const ApiClient = await loadApiClient();
    await expect(ApiClient.get<{ ok: boolean }>('/api/system/health')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:9000/api/system/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns undefined for empty 200 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response('', { status: 200 }));

    const ApiClient = await loadApiClient();
    await expect(ApiClient.get('/api/system/health')).resolves.toBeUndefined();
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const ApiClient = await loadApiClient();
    await expect(ApiClient.delete('/api/system/health')).resolves.toBeUndefined();
  });

  it('throws when production has no backend URL and no fallback', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_FASTAPI_URL;
    vi.resetModules();

    const ApiClient = await loadApiClient();
    await expect(ApiClient.get('/api/system/health')).rejects.toThrow(
      'Backend not available and no fallback provided for /api/system/health',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses a Next.js fallback immediately when no backend URL is configured', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_FASTAPI_URL;
    vi.resetModules();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'ok' }), { status: 200 }),
    );

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.get('/api/system/health', { fallback: '/health' }),
    ).resolves.toEqual({ status: 'ok' });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/health',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('falls back when the FastAPI backend responds with an error status', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('upstream down', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: 'ok' }), { status: 200 }));

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.get('/api/system/health', { fallback: '/health' }),
    ).resolves.toEqual({ status: 'ok' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:9000/api/system/health',
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/health',
      expect.any(Object),
    );
  });

  it('falls back when the FastAPI request throws', async () => {
    fetchMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(new Response(JSON.stringify({ recovered: true }), { status: 200 }));

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.post('/api/ai/chat/query', { query: 'hello' }, { fallback: '/api/chat' }),
    ).resolves.toEqual({ recovered: true });
  });

  it('resolves absolute fallback URLs without rewriting them', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_FASTAPI_URL;
    vi.resetModules();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ via: 'absolute' }), { status: 200 }),
    );

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.get('/api/system/health', { fallback: 'https://fallback.example/health' }),
    ).resolves.toEqual({ via: 'absolute' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://fallback.example/health',
      expect.any(Object),
    );
  });

  it('prefixes relative fallback URLs with NEXTAUTH_URL on the server', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.NEXT_PUBLIC_FASTAPI_URL;
    vi.stubEnv('NEXTAUTH_URL', 'https://portfolio.example');
    vi.resetModules();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ via: 'nextauth' }), { status: 200 }),
    );

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.put('/api/system/status', { ok: true }, { fallback: '/api/sync-status' }),
    ).resolves.toEqual({ via: 'nextauth' });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://portfolio.example/api/sync-status',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('surfaces fallback failures when both backend and fallback reject', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('bad gateway', { status: 502 }))
      .mockResolvedValueOnce(new Response('fallback failed', { status: 500 }))
      .mockResolvedValueOnce(new Response('fallback failed', { status: 500 }));

    const ApiClient = await loadApiClient();
    await expect(
      ApiClient.get('/api/system/health', { fallback: '/health' }),
    ).rejects.toThrow('Fallback request failed: 500  - fallback failed');
  });
});
