import { aiPriorityService } from './aiPriorityService';
import { supabase } from './supabase';

interface DbProtocol {
    id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    user_id: string;
    requester: string;
    created_at: string;
    users?: { phone?: string };
}

interface AuthResponse {
    token: string;
    userId: string;
    name: string;
    email: string;
    cpf: string;
    phone?: string;
    role: string;
    createdAt: string;
}

function firstRow<T>(rows: T[] | null): T | null {
    return rows && rows.length > 0 ? rows[0] : null;
}

function decodeSessionToken(token: string): any {
    try {
        return JSON.parse(atob(token));
    } catch {
        return null;
    }
}

async function getFunctionErrorMessage(error: unknown): Promise<string> {
    if (
        error &&
        typeof error === 'object' &&
        'context' in error &&
        (error as { context?: unknown }).context instanceof Response
    ) {
        const body = await (error as { context: Response }).context.json().catch(() => null);
        return body?.error ?? 'Erro na Edge Function.';
    }

    return error instanceof Error ? error.message : String(error);
}

async function invokeAppAuth<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke('app-auth', { body });

    if (error) {
        throw new Error(await getFunctionErrorMessage(error));
    }

    if (!data?.success) {
        throw new Error(data?.error ?? 'Erro na autenticação. Tente novamente.');
    }

    return data.data as T;
}

function mapProtocol(item: DbProtocol) {
    return {
        ...item,
        id: item.id,
        service: item.category || 'Outros',
        requester: item.requester || 'Usuário',
        phone: item.users?.phone,
        date: item.created_at
            ? new Date(item.created_at).toLocaleDateString('pt-BR')
            : 'Data não informada',
        status: (item.status || 'Aberto') as 'Aberto' | 'Em Análise' | 'Concluído' | 'Atrasado',
        category: item.category || 'Outros',
        description: item.description,
        address: item.address
    };
}

export const api = {
    async login(cpf: string, password: string) {
        return invokeAppAuth<AuthResponse>({
            action: 'login',
            cpf,
            password
        });
    },

    async register(name: string, email: string, cpf: string, password: string) {
        return invokeAppAuth<AuthResponse>({
            action: 'register',
            name,
            email,
            cpf,
            password
        });
    },

    async getMe() {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        return invokeAppAuth<Omit<AuthResponse, 'token'>>({
            action: 'getMe',
            token
        });
    },

    async getProtocols(userId?: string) {
        let query = supabase
            .from('protocols')
            .select('*, users!inner(phone)')
            .order('created_at', { ascending: false });

        if (userId) {
            query = query.eq('user_id', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Supabase getProtocols error:', error);
            throw new Error('Erro ao buscar protocolos');
        }

        return (data as DbProtocol[]).map(mapProtocol);
    },

    async createProtocol(data: any) {
        const token = localStorage.getItem('cidadaoinforma_token');
        const payload = token ? decodeSessionToken(token) : null;

        const protocol = {
            id: crypto.randomUUID(),
            category: data.category,
            description: data.description,
            address: data.address,
            status: data.status || 'Aberto',
            user_id: data.userId || payload?.userId,
            requester: data.requester || payload?.name || 'Usuário',
            created_at: new Date().toISOString()
        };

        const { data: result, error } = await supabase
            .from('protocols')
            .insert(protocol)
            .select()
            .limit(1);

        if (error) {
            console.error('Supabase createProtocol error:', error);
            throw new Error('Erro ao criar protocolo');
        }

        const createdProtocol = firstRow(result as DbProtocol[]);
        if (!createdProtocol) {
            throw new Error('Protocolo criado, mas não foi possível carregar os dados.');
        }

        void aiPriorityService.classifyProtocol({
            protocolId: createdProtocol.id,
            description: createdProtocol.description,
            category: createdProtocol.category,
        }).catch((classificationError) => {
            console.error('Supabase AI classification error:', classificationError);
        });

        return createdProtocol;
    },

    async updatePhone(phone: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        return invokeAppAuth({
            action: 'updatePhone',
            token,
            phone
        });
    },

    getAuthHeader(contentType?: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };
        if (contentType) headers['Content-Type'] = contentType;
        return { headers };
    }
};
