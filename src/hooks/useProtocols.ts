import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Protocol } from '../constants';

export function useProtocols(role: 'citizen' | 'admin' | 'all' = 'all') {
    const [protocols, setProtocols] = useState<Protocol[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProtocols() {
            setLoading(true);
            const { data, error } = await supabase
                .from('protocols')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching protocols:', error);
                setProtocols([]);
            } else if (data) {
                if (role === 'citizen') {
                    setProtocols(data.filter((p: any) => p.requester === 'Carlos Silva'));
                } else {
                    setProtocols(data);
                }
            }
            setLoading(false);
        }

        fetchProtocols();
    }, [role]);

    // Specific single fetcher for details page
    const fetchProtocolById = async (id: string): Promise<Protocol | null> => {
        const { data, error } = await supabase
            .from('protocols')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) return null;
        return data as Protocol;
    };

    return { protocols, loading, fetchProtocolById };
}
