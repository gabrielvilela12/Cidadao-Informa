import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Shield, Calendar, KeyRound, Eye, EyeOff } from 'lucide-react';

export function Profile() {
    const { user, role } = useApp();
    const [showCpf, setShowCpf] = useState(false);

    // Função para mascarar o CPF (***.123.456-**)
    const maskCpf = (cpf: string) => {
        if (!cpf) return '';
        // Pegar apenas os números
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) return cpf; // Fallback se não tiver 11 dígitos

        // Mostra apenas os 6 do meio: ***.123.456-**
        return `***.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-**`;
    };

    // Formatar CPF completo se usuário quiser ver
    const formatCpf = (cpf: string) => {
        const cleanCpf = cpf.replace(/\D/g, '');
        if (cleanCpf.length !== 11) return cpf;
        return `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Data não disponível';
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Meu Perfil</h1>
                    <p className="text-gray-400">
                        Gerencie suas informações pessoais e configurações de conta.
                    </p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Card Esquerdo - Resumo */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-[#1A2634] rounded-2xl p-6 border border-[#2A3F54] flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                <User className="w-12 h-12 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-1">{user?.full_name}</h2>
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full mb-4">
                                {role === 'admin' ? 'Administrador' : 'Cidadão'}
                            </span>
                            <p className="text-sm text-gray-400 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Membro desde {formatDate(user?.created_at)}
                            </p>
                        </div>
                    </div>

                    {/* Card Direito - Detalhes */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-[#1A2634] rounded-2xl p-6 border border-[#2A3F54]">
                            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-[#2A3F54] pb-4">
                                <Shield className="w-5 h-5 text-blue-400" />
                                Informações Pessoais
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1 block">Nome Completo</label>
                                    <div className="flex items-center gap-3 bg-[#101922] p-3 rounded-lg border border-[#2A3F54]">
                                        <User className="w-5 h-5 text-gray-500" />
                                        <span className="text-white font-medium">{user?.full_name}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1 block">E-mail</label>
                                    <div className="flex items-center gap-3 bg-[#101922] p-3 rounded-lg border border-[#2A3F54]">
                                        <Mail className="w-5 h-5 text-gray-500" />
                                        <span className="text-white font-medium">{user?.email || 'email@exemplo.com'}</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-400 mb-1 block">CPF</label>
                                    <div className="flex items-center gap-3 bg-[#101922] p-3 rounded-lg border border-[#2A3F54]">
                                        <KeyRound className="w-5 h-5 text-gray-500" />
                                        <span className="text-white font-medium font-mono flex-1">
                                            {showCpf && user?.cpf ? formatCpf(user.cpf) : maskCpf(user?.cpf || '')}
                                        </span>
                                        <button
                                            onClick={() => setShowCpf(!showCpf)}
                                            className="p-1 hover:bg-[#2A3F54] rounded-md transition-colors text-gray-400 hover:text-white"
                                            title={showCpf ? "Ocultar CPF" : "Mostrar CPF"}
                                        >
                                            {showCpf ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Para sua segurança contra curiosos ("shoulder surfing"), seu CPF é mascarado por padrão.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
