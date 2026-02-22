const API_URL = 'http://localhost:5206/api';

/**
 * Módulo de comunicação com a API backend da Zeladoria Pública.
 * Abstrai as requisições HTTP (fetch) e o tratamento padrão de erros (ProblemDetails/ASP.NET).
 */
export const api = {
    // AUTHENTICATION

    /**
     * Autentica o usuário na plataforma usando CPF e Senha.
     * 
     * @param cpf O CPF do usuário (apenas números ou formatado, desde que o backend suporte).
     * @param password Senha de acesso.
     * @returns A resposta da API contendo o token JWT e os dados do usuário.
     * @throws Erro tratado extraído do ProblemDetails do backend.
     */
    async login(cpf: string, password: string) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cpf, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));

            if (err.errors) {
                const firstErrorKey = Object.keys(err.errors)[0];
                const firstErrorMsg = err.errors[firstErrorKey][0];
                throw new Error(firstErrorMsg);
            }

            const errorMessage = err.error || err.Error || err.message || err.detail || 'Erro ao fazer login';
            throw new Error(errorMessage);
        }
        return res.json();
    },

    /**
     * Registra um novo cidadão no sistema.
     * 
     * @param name Nome completo.
     * @param email Endereço de e-mail.
     * @param cpf CPF válido do cidadão.
     * @param password Senha segura.
     * @returns A resposta da API indicando sucesso ou erro na criação do usuário.
     */
    async register(name: string, email: string, cpf: string, password: string) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, cpf, password })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));

            // Check for ASP.NET problem details (validation errors)
            if (err.errors) {
                const firstErrorKey = Object.keys(err.errors)[0];
                const firstErrorMsg = err.errors[firstErrorKey][0];
                throw new Error(firstErrorMsg);
            }

            const errorMessage = err.error || err.Error || err.message || err.detail || 'Erro ao cadastrar usuário';
            throw new Error(errorMessage);
        }
        return res.json();
    },

    /**
     * Bate no endpoint /me para recuperar os dados reais do usuário baseado no Token.
     * Serve para validar se o usuário ainda existe no banco após um reload da página.
     * 
     * @returns Dados atualizados do usuário.
     * @throws Erro 401 caso o Token seja inválido ou usuário tenha sido removido.
     */
    async getMe() {
        const res = await fetch(`${API_URL}/auth/me`, this.getAuthHeader());
        if (!res.ok) {
            throw new Error('Sessão inválida ou expirada.');
        }
        return res.json();
    },

    // PROTOCOLS

    /**
     * Recupera a lista de protocolos (solicitações de zeladoria).
     * Pode ser filtrada opcionalmente pelo ID de um usuário específico (para o cidadão).
     * Administradores geralmente não passam o ID para reaver a lista global.
     * 
     * @param userId (Opcional) O ID do usuário para o qual os protocolos serão filtrados.
     * @returns Uma lista de protocolos mapeados para a estrutura esperada pelo frontend.
     */
    async getProtocols(userId?: string) {
        const url = userId ? `${API_URL}/protocols?userId=${userId}` : `${API_URL}/protocols`;
        const res = await fetch(url, this.getAuthHeader());
        if (!res.ok) throw new Error('Erro ao buscar protocolos');
        const data = await res.json();

        // Map backend properties to frontend expected format
        return data.map((item: any) => ({
            ...item,
            id: item.id || item.Id,
            requester: item.userName || item.UserName || 'Usuário',
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : 'Data não informada',
            status: item.status || item.Status || 'Aberto',
            category: item.category || item.Category || 'Outros',
            description: item.description || item.Description,
            address: item.address || item.Address
        }));
    },

    /**
     * Cria um novo protocolo/solicitação (ex: Buraco na rua, Lâmpada queimada).
     * 
     * @param data Objeto contendo os dados do protocolo (categoria, descrição, endereço, etc).
     * @returns O objeto do protocolo criado na base de dados.
     */
    async createProtocol(data: any) {
        const res = await fetch(`${API_URL}/protocols`, {
            method: 'POST',
            ...this.getAuthHeader('application/json'),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Erro ao criar protocolo');
        return res.json();
    },

    // UTILS

    /**
     * Função utilitária interna para compor os cabeçalhos de autenticação das requisições privadas.
     * Recupera o token JWT ativo armazenado no LocalStorage.
     * 
     * @param contentType (Opcional) Define o cabeçalho 'Content-Type'. Útil para POST/PUT com JSON.
     * @returns O objeto de cabeçalho (Headers) formatado para uso na chamada `fetch`.
     */
    getAuthHeader(contentType?: string) {
        const token = localStorage.getItem('zeladoria_token');
        const headers: HeadersInit = {
            'Authorization': `Bearer ${token}`
        };
        if (contentType) headers['Content-Type'] = contentType;
        return { headers };
    }
};
