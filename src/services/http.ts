const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

function getApiUrl(path: string): string {
  if (!configuredApiUrl) {
    throw new Error('VITE_API_URL não está configurada.');
  }

  return `${configuredApiUrl.replace(/\/+$/, '')}${path}`;
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    headers: providedHeaders,
    ...requestOptions
  } = options;
  const headers = new Headers(providedHeaders);

  if (requestOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (authenticated) {
    const token = localStorage.getItem('cidadaoinforma_token');
    if (!token) {
      throw new Error('Sessão inválida ou expirada.');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...requestOptions,
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ?? `A API respondeu com o status ${response.status}.`,
    );
  }

  return data as T;
}
