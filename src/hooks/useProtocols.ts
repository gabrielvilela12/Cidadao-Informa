import { useCallback, useEffect, useState } from 'react';
import { Protocol } from '../constants';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

// O parametro `role` nao vai mais para a API: o backend decide o escopo pelo
// token. Ele permanece na assinatura porque as paginas o informam e ele mantem
// o cache de fetch separado por contexto de uso.
export function useProtocols(role: 'citizen' | 'admin' | 'all' = 'all') {
    const { user } = useApp();
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProtocols = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            // O filtro por usuario acontece no servidor, a partir do token:
            // cidadao recebe so os proprios protocolos, admin recebe todos.
            const data = await api.getProtocols();
            setProtocols(data);
        } catch (error) {
            console.error('Error fetching protocols:', error);
            setError(error instanceof Error ? error.message : 'Erro ao carregar protocolos.');
            setProtocols([]);
        }
        setLoading(false);
    }, [role]);

    useEffect(() => {
        if (user) {
            void fetchProtocols();
        } else {
            setProtocols([]);
            setError('');
            setLoading(false);
        }
    }, [fetchProtocols, user]);

    // Specific single fetcher for details page
    const fetchProtocolById = useCallback(async (id: string): Promise<Protocol | null> => {
        try {
            return await api.getProtocolById(id);
        } catch {
            return null;
        }
    }, []);

    return { protocols, loading, error, fetchProtocolById, refetch: fetchProtocols };
}
