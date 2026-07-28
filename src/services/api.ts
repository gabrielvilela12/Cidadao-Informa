import { apiRequest } from './http';

interface ApiProtocol {
    id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    userId?: string;
    requester?: string;
    phone?: string;
    createdAt: string;
    aiPriority?: 'baixa' | 'media' | 'alta' | 'critica' | null;
    aiStatus?: 'pending' | 'success' | 'failed' | null;
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

interface ApiAuditBlock {
    id: string;
    blockIndex: number | string;
    protocolId: string;
    eventType: string;
    actorId: string | null;
    actorRole: string;
    previousStatus: string | null;
    newStatus: string | null;
    payloadHash: string;
    previousBlockHash: string | null;
    blockHash: string;
    createdAt: string;
    valid: boolean;
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

function mapProtocol(item: ApiProtocol) {
    return {
        ...item,
        user_id: item.userId,
        created_at: item.createdAt,
        ai_priority: item.aiPriority,
        ai_status: item.aiStatus,
        service: item.category || 'Outros',
        requester: item.requester || 'Usuário',
        date: item.createdAt
            ? new Date(item.createdAt).toLocaleDateString('pt-BR')
            : 'Data não informada',
        status: (item.status || 'Aberto') as 'Aberto' | 'Em Análise' | 'Concluído' | 'Atrasado',
        category: item.category || 'Outros',
    };
}

function mapAuditTrail(data: { valid: boolean; blocks: ApiAuditBlock[] }): ProtocolAuditTrail {
    return {
        valid: data.valid,
        blocks: data.blocks.map((block) => ({
            id: block.id,
            block_index: block.blockIndex,
            protocol_id: block.protocolId,
            event_type: block.eventType,
            actor_id: block.actorId,
            actor_role: block.actorRole,
            previous_status: block.previousStatus,
            new_status: block.newStatus,
            payload_hash: block.payloadHash,
            previous_block_hash: block.previousBlockHash,
            block_hash: block.blockHash,
            created_at: block.createdAt,
            is_valid: block.valid,
        })),
    };
}

export const api = {
    login(cpf: string, password: string) {
        return apiRequest<AuthResponse>('/api/auth/login', {
            method: 'POST',
            authenticated: false,
            body: JSON.stringify({ cpf, password }),
        });
    },

    register(name: string, email: string, cpf: string, password: string) {
        return apiRequest<AuthResponse>('/api/auth/register', {
            method: 'POST',
            authenticated: false,
            body: JSON.stringify({ name, email, cpf, password }),
        });
    },

    getMe() {
        return apiRequest<Omit<AuthResponse, 'token'>>('/api/auth/me');
    },

    async getProtocols(_userId?: string, _scope: 'citizen' | 'admin' | 'all' = 'citizen') {
        const data = await apiRequest<ApiProtocol[]>('/api/protocols');
        return data.map(mapProtocol);
    },

    async getProtocolById(id: string) {
        const data = await apiRequest<ApiProtocol>(`/api/protocols/${encodeURIComponent(id)}`);
        return mapProtocol(data);
    },

    async getPublicProtocolById(id: string) {
        const data = await apiRequest<ApiProtocol>(
            `/api/protocols/public/${encodeURIComponent(id)}`,
            { authenticated: false },
        );
        return mapProtocol(data);
    },

    async createProtocol(data: any) {
        return apiRequest<ApiProtocol>('/api/protocols', {
            method: 'POST',
            body: JSON.stringify({
                category: data.category,
                description: data.description,
                address: data.address,
            }),
        });
    },

    async getProtocolAuditTrail(protocolId: string) {
        const data = await apiRequest<{ valid: boolean; blocks: ApiAuditBlock[] }>(
            `/api/protocols/${encodeURIComponent(protocolId)}/audit`,
        );
        return mapAuditTrail(data);
    },

    verifyAuditChain() {
        return apiRequest('/api/protocols/audit/verify');
    },

    async updateProtocolStatus(protocolId: string, status: string, reason?: string) {
        const data = await apiRequest<ApiProtocol>(
            `/api/protocols/${encodeURIComponent(protocolId)}/status`,
            {
                method: 'PATCH',
                body: JSON.stringify({ status, reason }),
            },
        );
        return mapProtocol(data);
    },

    updatePhone(phone: string) {
        return apiRequest('/api/auth/me/phone', {
            method: 'PATCH',
            body: JSON.stringify({ phone }),
        });
    },

    getAuthHeader(contentType?: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        const headers: HeadersInit = {
            Authorization: `Bearer ${token}`,
        };
        if (contentType) headers['Content-Type'] = contentType;
        return { headers };
    },
};
