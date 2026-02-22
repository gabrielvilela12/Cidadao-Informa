import { useEffect, useState } from 'react';
import { Protocol } from '../constants';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export function useProtocols(role: 'citizen' | 'admin' | 'all' = 'all') {
    const { user } = useApp();
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProtocols() {
            setLoading(true);
            try {
                // If citizen, pass userId to get only their protocols
                const data = await api.getProtocols(role === 'citizen' ? user?.id : undefined);
                setProtocols(data);
            } catch (error) {
                console.error('Error fetching protocols:', error);
                setProtocols([]);
            }
            setLoading(false);
        }

        if (user) {
            fetchProtocols();
        } else {
            setProtocols([]);
            setLoading(false);
        }
    }, [role, user]);

    // Specific single fetcher for details page
    const fetchProtocolById = async (id: string): Promise<Protocol | null> => {
        try {
            const data = await api.getProtocols();
            const protocol = data.find((p: any) => p.id?.toString() === id);
            return protocol || null;
        } catch {
            return null;
        }
    };

    return { protocols, loading, fetchProtocolById };
}
