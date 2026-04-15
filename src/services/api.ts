import bcrypt from 'bcryptjs';
import { supabase } from './supabase';

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface DbUser {
    id: string;
    full_name: string;
    email: string;
    cpf: string;
    phone?: string;
    role: string;
    password_hash: string;
    created_at: string;
}

interface DbProtocol {
    id: string;
    category: string;
    description: string;
    address: string;
    status: string;
    user_id: string;
    requester: string;
    created_at: string;
}

// ─── Utilitários de sessão ─────────────────────────────────────────────────────

/**
 * Gera um token de sessão simples (Base64) contendo os dados do usuário.
 * Não é um JWT assinado — serve apenas para persistir a sessão no localStorage.
 */
function createSessionToken(user: DbUser): string {
    const payload = {
        userId: user.id,
        cpf: user.cpf,
        role: user.role,
        name: user.full_name,
        email: user.email,
        phone: user.phone,
        createdAt: user.created_at,
        iat: Date.now()
    };
    return btoa(JSON.stringify(payload));
}

/**
 * Decodifica o token de sessão armazenado no localStorage.
 */
function decodeSessionToken(token: string): any {
    try {
        return JSON.parse(atob(token));
    } catch {
        return null;
    }
}

// ─── Módulo de API ────────────────────────────────────────────────────────────

/**
 * Módulo de comunicação com o Supabase (banco de dados PostgreSQL).
 * Substitui as chamadas ao backend .NET local para funcionar em produção.
 */
export const api = {

    // AUTHENTICATION

    /**
     * Autentica o usuário usando CPF e Senha (verificação bcrypt).
     */
    async login(cpf: string, password: string) {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('cpf', cpf)
            .single();

        if (error || !data) {
            throw new Error('CPF ou senha inválidos.');
        }

        const user = data as DbUser;
        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            throw new Error('CPF ou senha inválidos.');
        }

        const token = createSessionToken(user);

        return {
            token,
            userId: user.id,
            name: user.full_name,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
        };
    },

    /**
     * Registra um novo cidadão no sistema com senha hasheada via bcrypt.
     */
    async register(name: string, email: string, cpf: string, password: string) {
        // Verificar duplicidade de CPF
        const { data: existingCpf } = await supabase
            .from('users')
            .select('id')
            .eq('cpf', cpf)
            .maybeSingle();

        if (existingCpf) {
            throw new Error('Já existe uma conta cadastrada com este CPF.');
        }

        // Verificar duplicidade de e-mail
        const normalizedEmail = email.trim().toLowerCase();
        const { data: existingEmail } = await supabase
            .from('users')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existingEmail) {
            throw new Error('Já existe uma conta cadastrada com este E-mail.');
        }

        // Hash da senha com bcrypt (custo 10 é padrão seguro)
        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = {
            id: crypto.randomUUID(),
            full_name: name,
            email: normalizedEmail,
            cpf,
            role: 'citizen',
            password_hash: passwordHash,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('users')
            .insert(newUser)
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            throw new Error('Erro ao cadastrar usuário. Tente novamente.');
        }

        const user = data as DbUser;
        const token = createSessionToken(user);

        return {
            token,
            userId: user.id,
            name: user.full_name,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
        };
    },

    /**
     * Recupera os dados do usuário autenticado via token de sessão no localStorage.
     */
    async getMe() {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        const payload = decodeSessionToken(token);
        if (!payload || !payload.userId) throw new Error('Sessão inválida ou expirada.');

        // Confirma que o usuário ainda existe no banco
        const { data, error } = await supabase
            .from('users')
            .select('id, full_name, email, cpf, phone, role, created_at')
            .eq('id', payload.userId)
            .single();

        if (error || !data) {
            throw new Error('Usuário não encontrado. Sessão encerrada.');
        }

        const user = data as Omit<DbUser, 'password_hash'>;

        return {
            userId: user.id,
            name: user.full_name,
            email: user.email,
            cpf: user.cpf,
            phone: user.phone,
            role: user.role,
            createdAt: user.created_at
        };
    },

    // PROTOCOLS

    /**
     * Recupera a lista de protocolos, opcionalmente filtrada por usuário.
     */
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

        return (data as any[]).map((item) => ({
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
        }));
    },

    /**
     * Cria um novo protocolo/solicitação.
     */
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
            .single();

        if (error) {
            console.error('Supabase createProtocol error:', error);
            throw new Error('Erro ao criar protocolo');
        }

        return result;
    },

    /**
     * Atualiza o número de telefone do usuário autenticado.
     */
    async updatePhone(phone: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        if (!token) throw new Error('Sessão inválida ou expirada.');

        const payload = decodeSessionToken(token);
        if (!payload || !payload.userId) throw new Error('Sessão inválida ou expirada.');

        const { data, error } = await supabase
            .from('users')
            .update({ phone })
            .eq('id', payload.userId)
            .select()
            .single();

        if (error) {
            console.error('Supabase updatePhone error:', error);
            throw new Error('Erro ao atualizar telefone');
        }

        return data;
    },

    // UTILS (mantido para compatibilidade com código existente)
    getAuthHeader(contentType?: string) {
        const token = localStorage.getItem('cidadaoinforma_token');
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };
        if (contentType) headers['Content-Type'] = contentType;
        return { headers };
    }
};
