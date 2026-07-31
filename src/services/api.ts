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
    /** Posição confirmada no mapa. Depende do backend Java expor o campo. */
    latitude?: number | null;
    longitude?: number | null;
    aiPriority?: 'baixa' | 'media' | 'alta' | 'critica' | null;
    aiStatus?: 'pending' | 'success' | 'failed' | null;
    imageUrls?: string[];
    image_urls?: string[];
    correctedImageUrls?: string[];
    correctionStatus?: 'idle' | 'processing' | 'success' | 'failed';
    correctionError?: string | null;
    correctionGeneratedAt?: string | null;
    correctionReport?: string | null;
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
        // null = sem localização confirmada. Não substituir por um valor padrão:
        // o mapa depende do null para omitir o pin em vez de inventar posição.
        latitude: typeof item.latitude === 'number' ? item.latitude : null,
        longitude: typeof item.longitude === 'number' ? item.longitude : null,
        image_urls: item.imageUrls ?? item.image_urls ?? [],
        corrected_image_urls: item.correctedImageUrls ?? [],
        correction_status: item.correctionStatus ?? 'idle',
        correction_error: item.correctionError ?? null,
        correction_generated_at: item.correctionGeneratedAt ?? null,
        correction_report: item.correctionReport ?? null,
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

    // O escopo é decidido no servidor a partir do token: cidadão recebe só os
    // próprios protocolos, admin recebe todos. Não há parâmetro do cliente.
    async getProtocols() {
        const data = await apiRequest<ApiProtocol[]>('/api/protocols');
        return data.map(mapProtocol);
    },

    /**
     * Métricas agregadas da landing pública (sem autenticação, só contagens).
     *
     * PENDENTE NO BACKEND: `GET /api/protocols/stats` ainda não existe. Até ser
     * criado, a chamada falha e a landing exibe "—" nos cartões. Isso é
     * deliberado: antes havia números fixos inventados ("12.4 mil atendidas",
     * "98% de satisfação") sem lastro nos dados, e um traço honesto é melhor
     * que um número falso.
     *
     * Contrato esperado:
     *   { total: number, resolved: number, resolutionRate: number|null, citizens: number }
     * `resolutionRate` deve vir null quando `total` for 0, para a interface
     * distinguir "sem base de cálculo" de "0% resolvido".
     */
    async getPublicStats() {
        return apiRequest<{
            total: number;
            resolved: number;
            resolutionRate: number | null;
            citizens: number;
        }>('/api/protocols/stats', { authenticated: false });
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
                // Posição que o solicitante confirmou no mapa. É o que a equipe
                // usa para chegar ao local, então precisa ser persistida.
                latitude: data.latitude ?? null,
                longitude: data.longitude ?? null,
                imageUrls: data.imageUrls ?? [],
            }),
        });
    },

    /**
     * Geocodifica no servidor os protocolos abertos antes de a posição do mapa
     * ser gravada. Processa um lote por chamada (limite de uso do Nominatim):
     * repita enquanto `remaining` for maior que zero. Restrito a administradores.
     */
    async backfillCoordinates(limit?: number) {
        return apiRequest<{
            processed: number;
            located: number;
            skipped: number;
            failed: number;
            remaining: number;
        }>('/api/protocols/geocode/backfill', {
            method: 'POST',
            body: JSON.stringify({ limit: limit ?? null }),
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

    async generateCorrectedImages(protocolId: string) {
        const data = await apiRequest<ApiProtocol>(
            `/api/protocols/${encodeURIComponent(protocolId)}/ai-correction`,
            { method: 'POST' },
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
