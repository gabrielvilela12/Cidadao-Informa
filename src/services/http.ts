const configuredApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

/**
 * Erro vindo da camada de API.
 *
 * `userFacing` separa duas coisas que antes chegavam iguais na tela: a mensagem
 * que o backend escreveu para o cidadao ("CPF ou senha invalidos") e o detalhe
 * tecnico que nasce aqui (variavel de ambiente ausente, status HTTP cru). Sem
 * essa distincao a tela de login exibia literalmente "VITE_API_URL nao esta
 * configurada." para quem so queria entrar.
 */
export class ApiError extends Error {
  readonly userFacing: boolean;

  constructor(message: string, userFacing: boolean) {
    super(message);
    this.name = 'ApiError';
    this.userFacing = userFacing;
  }
}

function getApiUrl(path: string): string {
  if (!configuredApiUrl) {
    throw new ApiError('VITE_API_URL não está configurada.', false);
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
      throw new ApiError('Sessão inválida ou expirada.', true);
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...requestOptions,
    headers,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Mensagem escrita pelo backend e para o usuario ler; status HTTP nu, nao.
    throw data?.error
      ? new ApiError(String(data.error), true)
      : new ApiError(`A API respondeu com o status ${response.status}.`, false);
  }

  return data as T;
}
