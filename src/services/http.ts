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

/**
 * Acorda o container Java enquanto o visitante ainda esta na tela publica.
 *
 * A Vercel pode reduzir o backend a zero. Esta chamada e intencionalmente
 * silenciosa: ela nao bloqueia a renderizacao e uma falha sera tratada pela
 * requisicao real de login, que possui a mensagem adequada para o usuario.
 */
export async function warmApi(): Promise<void> {
  try {
    await fetch(getApiUrl('/api/health'), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    // Preaquecimento e apenas uma otimizacao, nunca um requisito da interface.
  }
}

type ApiRequestOptions = RequestInit & {
  authenticated?: boolean;
};

export interface ServerSentEvent {
  event: string;
  data: string;
  id?: string;
}

interface EventStreamOptions {
  signal: AbortSignal;
  onEvent: (event: ServerSentEvent) => void;
}

export interface EventStreamParser {
  push: (chunk: string) => void;
  finish: () => void;
}

/** Parser incremental do formato SSE, independente do transporte HTTP. */
export function createEventStreamParser(
  onEvent: (event: ServerSentEvent) => void,
): EventStreamParser {
  let buffer = '';
  let eventName = 'message';
  let eventId: string | undefined;
  let dataLines: string[] = [];

  const dispatch = () => {
    if (dataLines.length > 0) {
      onEvent({
        event: eventName,
        data: dataLines.join('\n'),
        id: eventId,
      });
    }
    eventName = 'message';
    eventId = undefined;
    dataLines = [];
  };

  const consumeLine = (line: string) => {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const separator = line.indexOf(':');
    const field = separator >= 0 ? line.slice(0, separator) : line;
    let value = separator >= 0 ? line.slice(separator + 1) : '';
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'event') eventName = value || 'message';
    if (field === 'data') dataLines.push(value);
    if (field === 'id') eventId = value;
  };

  return {
    push(chunk: string) {
      buffer += chunk;
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() ?? '';
      lines.forEach(consumeLine);
    },
    finish() {
      if (buffer) consumeLine(buffer.replace(/\r$/, ''));
      buffer = '';
      dispatch();
    },
  };
}

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

/** Faz download binário preservando autenticação e mensagens de erro da API. */
export async function apiRequestBlob(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Blob> {
  const {
    authenticated = true,
    headers: providedHeaders,
    ...requestOptions
  } = options;
  const headers = new Headers(providedHeaders);
  headers.set('Accept', 'application/pdf');

  if (authenticated) {
    const token = localStorage.getItem('cidadaoinforma_token');
    if (!token) throw new ApiError('Sessão inválida ou expirada.', true);
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), { ...requestOptions, headers });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw data?.error
      ? new ApiError(String(data.error), true)
      : new ApiError(`A API respondeu com o status ${response.status}.`, false);
  }
  return response.blob();
}

/**
 * Abre um SSE autenticado usando fetch.
 *
 * EventSource nao permite enviar o bearer token no header Authorization. Usar
 * fetch preserva o protocolo text/event-stream sem expor o JWT na URL, nos
 * logs do proxy ou no historico do navegador.
 */
export async function readEventStream(
  path: string,
  { signal, onEvent }: EventStreamOptions,
): Promise<void> {
  const token = localStorage.getItem('cidadaoinforma_token');
  if (!token) {
    throw new ApiError('Sessão inválida ou expirada.', true);
  }

  const response = await fetch(getApiUrl(path), {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
    signal,
  });

  if (!response.ok || !response.body) {
    throw new ApiError(
      `Não foi possível abrir as atualizações em tempo real (${response.status}).`,
      response.status === 401 || response.status === 403,
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const parser = createEventStreamParser(onEvent);

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    if (done) break;

    parser.push(decoder.decode(value, { stream: true }));
  }

  parser.push(decoder.decode());
  parser.finish();
}
