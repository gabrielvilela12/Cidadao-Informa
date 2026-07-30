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
    latitude?: number | null;
    longitude?: number | null;
    ai_priority?: 'baixa' | 'media' | 'alta' | 'critica' | null;
    ai_status?: 'pending' | 'success' | 'failed';
    users?: { phone?: string };
}

export interface ProtocolAuditBlock {
    id: string;
    block_index: number | string;
    protocol_id: string;
    event_type: string;
    actor_id: string | null;
    actor_role: string;
    previous_status: string | null;
    new_status: string | null;
    payload_hash: string;
    previous_block_hash: string | null;
    block_hash: string;
    created_at: string;
    is_valid: boolean;
}

export interface ProtocolAuditTrail {
    valid: boolean;
    blocks: ProtocolAuditBlock[];
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
        address: item.address,
        // null/undefined = sem localizacao confirmada. Nao substituir por um
        // valor padrao: o mapa depende do null para omitir o pin.
        latitude: typeof item.latitude === 'number' ? item.latitude : null,
        longitude: typeof item.longitude === 'number' ? item.longitude : null
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

    // O escopo do resultado e decidido no servidor: a Edge Function filtra por
    // user_id derivado do token e exige role admin para os escopos amplos.
    // Nao existe (nem deve existir) parametro de userId vindo do cliente.
    async getProtocols(scope: 'citizen' | 'admin' | 'all' = 'citizen') {
        const token = localStorage.getItem('cidadaoinforma_token');

        const data = await invokeAppProtocols<DbProtocol[]>({
            action: 'list',
            token,
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
            status: data.status || 'Aberto',
            // Posicao confirmada pelo solicitante no mapa. Sem ela o protocolo
            // fica sem localizacao e nao recebe pin.
            latitude: data.latitude ?? null,
            longitude: data.longitude ?? null
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

    async getProtocolAuditTrail(protocolId: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('SessÃ£o invÃ¡lida ou expirada.');

        return invokeAppProtocols<ProtocolAuditTrail>({
            action: 'auditTrail',
            token,
            protocolId
        });
    },

    /** Métricas agregadas para a landing pública. Não requer autenticação. */
    async getPublicStats() {
        return invokeAppProtocols<{
            total: number;
            resolved: number;
            resolutionRate: number | null;
            citizens: number;
        }>({ action: 'publicStats' });
    },

    /**
     * Preenche as coordenadas de protocolos antigos a partir do endereço.
     * A geocodificação roda na Edge Function (nunca no browser). Processa em
     * lotes: chame novamente enquanto `remaining` for maior que zero.
     */
    async backfillCoordinates(limit = 8) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        return invokeAppProtocols<{
            processed: number;
            located: number;
            skipped: number;
            failed: number;
            remaining: number;
        }>({
            action: 'backfillCoordinates',
            token,
            limit
        });
    },

    async verifyAuditChain() {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('SessÃ£o invÃ¡lida ou expirada.');

        return invokeAppProtocols({
            action: 'verifyAuditChain',
            token
        });
    },

    async updateProtocolStatus(protocolId: string, status: string, reason?: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('SessÃ£o invÃ¡lida ou expirada.');

        const data = await invokeAppProtocols<DbProtocol>({
            action: 'setStatus',
            token,
            protocolId,
            status,
            reason
        });

        return mapProtocol(data);
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
