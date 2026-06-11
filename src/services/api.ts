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

async function invokeAppProtocols<T>(body: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.functions.invoke('app-protocols', { body });

    if (error) {
        throw new Error(await getFunctionErrorMessage(error));
    }

    if (!data?.success) {
        throw new Error(data?.error ?? 'Erro ao processar protocolo. Tente novamente.');
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

    async getProtocols(userId?: string, scope: 'citizen' | 'admin' | 'all' = 'citizen') {
        const token = localStorage.getItem('cidadaoinforma_token');

        const data = await invokeAppProtocols<DbProtocol[]>({
            action: 'list',
            token,
            userId,
            scope
        });

        return data.map(mapProtocol);
    },

    async getProtocolById(id: string) {
        const data = await invokeAppProtocols<DbProtocol | null>({
            action: 'getById',
            id
        });

        return data ? mapProtocol(data) : null;
    },

    async createProtocol(data: any) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        const createdProtocol = await invokeAppProtocols<DbProtocol>({
            action: 'create',
            token,
            category: data.category,
            description: data.description,
            address: data.address,
            status: data.status || 'Aberto'
        });

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
