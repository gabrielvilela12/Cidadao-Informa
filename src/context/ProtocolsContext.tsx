import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Protocol } from '../constants';
import { api } from '../services/api';
import { useApp } from './AppContext';

/**
 * Cache da lista de protocolos, compartilhado por todas as telas.
 *
 * Antes cada tela montava o proprio `useProtocols`, que disparava
 * `GET /api/protocols` do zero. Trocar de tela custava uma requisicao inteira
 * toda vez - medido em producao, ~1,4s por navegacao mesmo com o backend quente
 * e a resposta ja sem as imagens. Como o escopo vem do token e os dados mudam
 * pouco, buscar uma vez por sessao e revalidar em segundo plano entrega tela
 * instantanea depois da primeira carga.
 *
 * Tres cuidados que a implementacao ingenua erra:
 *
 * - Deduplicacao: varias telas montando no mesmo instante compartilham a
 *   requisicao em voo em vez de abrir N chamadas iguais.
 * - Revalidacao silenciosa: dados velhos sao atualizados sem limpar a lista nem
 *   levantar `loading`, senao a tela pisca spinner tendo conteudo para mostrar.
 * - Invalidacao explicita: criar protocolo ou mudar status marca o cache como
 *   velho. Sem isso o usuario voltaria para a lista dentro da janela de
 *   validade e nao veria a propria alteracao.
 */

/** Depois disso, a proxima tela que montar revalida em segundo plano. */
const STALE_AFTER_MS = 60_000;

interface ProtocolsCacheValue {
    protocols: Protocol[];
    loading: boolean;
    error: string;
    /** Revalida se os dados estiverem velhos. Nao limpa o que ja esta em tela. */
    ensureFresh: () => void;
    /** Marca o cache como velho: a proxima tela revalida. Use apos mutacoes. */
    invalidate: () => void;
    /** Busca agora, ignorando a janela de validade. */
    refetch: () => Promise<void>;
}

const ProtocolsCacheContext = createContext<ProtocolsCacheValue | undefined>(undefined);

export function ProtocolsProvider({ children }: { children: React.ReactNode }) {
    const { user } = useApp();
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Refs: dedupe e checagem de validade acontecem fora do ciclo de render.
    const hasData = useRef(false);
    const fetchedAt = useRef(0);
    const inFlight = useRef<Promise<void> | null>(null);
    const loadedFor = useRef<string | null>(null);

    const load = useCallback((): Promise<void> => {
        if (inFlight.current) return inFlight.current;

        // Spinner somente sem nada para mostrar: revalidacao nao pisca a tela.
        if (!hasData.current) setLoading(true);

        const request = (async () => {
            try {
                const data = await api.getProtocols();
                setProtocols(data);
                setError('');
                hasData.current = true;
                fetchedAt.current = Date.now();
            } catch (err) {
                console.error('Error fetching protocols:', err);
                setError(err instanceof Error ? err.message : 'Erro ao carregar protocolos.');
                // Falha em revalidacao mantem os dados que ja estavam em tela:
                // lista vazia seria pior que lista levemente desatualizada.
                if (!hasData.current) setProtocols([]);
            } finally {
                setLoading(false);
                inFlight.current = null;
            }
        })();

        inFlight.current = request;
        return request;
    }, []);

    const ensureFresh = useCallback(() => {
        if (!hasData.current || Date.now() - fetchedAt.current > STALE_AFTER_MS) {
            void load();
        }
    }, [load]);

    const invalidate = useCallback(() => {
        fetchedAt.current = 0;
    }, []);

    const refetch = useCallback(() => load(), [load]);

    // Uma busca por sessao. Trocar de usuario reinicia o cache; sair limpa.
    useEffect(() => {
        if (!user) {
            setProtocols([]);
            setError('');
            setLoading(false);
            hasData.current = false;
            fetchedAt.current = 0;
            loadedFor.current = null;
            return;
        }

        if (loadedFor.current === user.id) return;

        loadedFor.current = user.id;
        hasData.current = false;
        fetchedAt.current = 0;
        void load();
    }, [load, user]);

    return (
        <ProtocolsCacheContext.Provider
            value={{ protocols, loading, error, ensureFresh, invalidate, refetch }}
        >
            {children}
        </ProtocolsCacheContext.Provider>
    );
}

export function useProtocolsCache() {
    const context = useContext(ProtocolsCacheContext);
    if (!context) throw new Error('useProtocolsCache must be used within ProtocolsProvider');
    return context;
}
