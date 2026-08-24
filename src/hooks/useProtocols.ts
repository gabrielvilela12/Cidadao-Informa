import { useCallback, useEffect } from 'react';
import { Protocol } from '../constants';
import { useProtocolsCache } from '../context/ProtocolsContext';
import { api } from '../services/api';

/**
 * Lista de protocolos das telas.
 *
 * A busca em si vive no ProtocolsProvider, que mantem um cache compartilhado:
 * a primeira tela paga a requisicao e as seguintes leem o mesmo dado. Este hook
 * so pede revalidacao em segundo plano quando a tela monta, para dados velhos
 * nao ficarem presos na sessao.
 *
 * O parametro `role` continua na assinatura porque as sete telas o informam,
 * mas nao tem efeito: o escopo e decidido no servidor a partir do token -
 * cidadao recebe so os proprios protocolos, admin recebe todos.
 */
export function useProtocols(_role: 'citizen' | 'admin' | 'all' = 'all') {
    const { protocols, loading, error, ensureFresh, refetch, mergeProtocol } = useProtocolsCache();

    useEffect(() => {
        ensureFresh();
    }, [ensureFresh]);

    // Busca pontual da tela de detalhe, que precisa dos campos completos
    // (imagens e relatorio da IA nao vem na listagem).
    const fetchProtocolById = useCallback(async (id: string): Promise<Protocol | null> => {
        try {
            return await api.getProtocolById(id);
        } catch {
            return null;
        }
    }, []);

    return { protocols, loading, error, fetchProtocolById, refetch, mergeProtocol };
}
