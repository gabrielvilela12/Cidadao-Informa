import { afterEach, describe, expect, it, vi } from 'vitest';

describe('warmApi', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('antecipa o health sem propagar falhas para a interface', async () => {
    vi.stubEnv('VITE_API_URL', '/');
    const fetchMock = vi.fn().mockRejectedValue(new Error('backend iniciando'));
    vi.stubGlobal('fetch', fetchMock);

    const { warmApi } = await import('../services/http');

    await expect(warmApi()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('/api/health', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  });
});
