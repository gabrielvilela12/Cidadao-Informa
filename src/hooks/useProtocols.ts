import { useCallback, useEffect, useState } from 'react';
import { Protocol } from '../constants';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function useProtocols(role: 'citizen' | 'admin' | 'all' = 'all') {
    const { user } = useApp();
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchProtocols() {
            setLoading(true);
            setError('');
            try {
                // If citizen, pass userId to get only their protocols
                const data = await api.getProtocols(role === 'citizen' ? user?.id : undefined, role);
                setProtocols(data);
            } catch (error) {
                console.error('Error fetching protocols:', error);
                setError(error instanceof Error ? error.message : 'Erro ao carregar protocolos.');
                setProtocols([]);
            }
            setLoading(false);
        }

        if (user) {
            fetchProtocols();
        } else {
            setProtocols([]);
            setError('');
            setLoading(false);
        }
    }, [role, user]);

    // Specific single fetcher for details page
    const fetchProtocolById = useCallback(async (id: string): Promise<Protocol | null> => {
        try {
            return await api.getProtocolById(id);
        } catch {
            return null;
        }
    }, []);

    return { protocols, loading, error, fetchProtocolById };
}
