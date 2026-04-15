import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Mail, Shield, Calendar, KeyRound, Eye, EyeOff, MapPin, Phone, Edit2, Check, X } from 'lucide-react';
import { Header } from '../components/Header';
import { api } from '../services/api';

export function Profile() {
    const { user, role } = useApp();
    const [showCpf, setShowCpf] = useState(false);
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneValue, setPhoneValue] = useState(user?.phone || '');
    const [savingPhone, setSavingPhone] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const maskCpf = (cpf: string) => {
        if (!cpf) return '';
        const clean = cpf.replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `***.${clean.slice(3, 6)}.${clean.slice(6, 9)}-**`;
    };

    const formatCpf = (cpf: string) => {
        const clean = cpf.replace(/\D/g, '');
        if (clean.length !== 11) return cpf;
        return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Data não disponível';
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatPhone = (phone: string) => {
        const clean = phone.replace(/\D/g, '');
        if (clean.length === 11) return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
        if (clean.length === 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        return phone;
    };

    const handleSavePhone = async () => {
        setPhoneError('');
        const clean = phoneValue.replace(/\D/g, '');

        if (!clean) {
            setPhoneError('Digite um número de telefone válido');
            return;
        }

        if (clean.length < 10 || clean.length > 11) {
            setPhoneError('Telefone deve ter 10 ou 11 dígitos');
            return;
        }

        setSavingPhone(true);
        try {
            await api.updatePhone(clean);
            setEditingPhone(false);
            window.location.reload();
        } catch (error) {
            setPhoneError('Erro ao salvar telefone. Tente novamente.');
            console.error(error);
        } finally {
            setSavingPhone(false);
        }
    };

    const initials = user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

    const InfoField = ({ label, icon: Icon, value, extra }: any) => (
        <div>
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">{label}</label>
            <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                <Icon size={16} className="text-slate-600 shrink-0" />
                <span className="text-white font-medium text-sm flex-1">{value}</span>
                {extra}
            </div>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#080d12]">
            <Header title="Meu Perfil" subtitle="Gerencie suas informações pessoais" />

            <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Avatar card */}
                    <div className="bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="size-20 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white mb-4 shadow-xl shadow-blue-600/30">
                            {initials}
                        </div>
                        <h2 className="text-xl font-black text-white mb-1">{user?.full_name || 'Usuário'}</h2>
                        <span className="px-3 py-1 bg-blue-500/15 text-blue-400 text-xs font-bold rounded-full mb-4 border border-blue-500/20">
                            {role === 'admin' ? '⚙️ Servidor Público' : '👤 Cidadão'}
                        </span>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Calendar size={12} />
                            Membro desde {formatDate(user?.created_at)}
                        </p>

                        {/* Decorative stats */}
                        <div className="w-full mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-white">—</p>
                                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Protocolos</p>
                            </div>
                            <div className="bg-white/5 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-emerald-400">98%</p>
                                <p className="text-[10px] text-slate-600 uppercase tracking-wide">Satisfação</p>
                            </div>
                        </div>
                    </div>

                    {/* Info card */}
                    <div className="md:col-span-2 bg-white/5 border border-white/8 rounded-2xl p-6 flex flex-col gap-5">
                        <div className="flex items-center gap-2 pb-4 border-b border-white/5">
                            <Shield size={18} className="text-blue-400" />
                            <h3 className="font-black text-white">Informações Pessoais</h3>
                        </div>

                        <InfoField label="Nome Completo" icon={User} value={user?.full_name || '—'} />
                        <InfoField label="E-mail" icon={Mail} value={user?.email || 'email@exemplo.com'} />
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">CPF</label>
                            <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                                <KeyRound size={16} className="text-slate-600 shrink-0" />
                                <span className="text-white font-medium text-sm flex-1 font-mono">
                                    {showCpf && user?.cpf ? formatCpf(user.cpf) : maskCpf(user?.cpf || '')}
                                </span>
                                <button onClick={() => setShowCpf(!showCpf)}
                                    className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors" title={showCpf ? 'Ocultar CPF' : 'Mostrar CPF'}>
                                    {showCpf ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-600 mt-1.5">CPF mascarado por segurança (shoulder surfing).</p>
                        </div>
                        
                        {/* Telefone - com edição */}
                        <div>
                            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5 block">Telefone</label>
                            {editingPhone ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                                            <Phone size={16} className="text-slate-600 shrink-0" />
                                            <input
                                                type="tel"
                                                value={phoneValue}
                                                onChange={(e) => setPhoneValue(e.target.value)}
                                                placeholder="(11) 99999-9999 ou 11999999999"
                                                className="bg-transparent text-white font-medium text-sm flex-1 outline-none placeholder-slate-600"
                                            />
                                        </div>
                                        {phoneError && (
                                            <p className="text-xs text-red-400 mt-1.5">{phoneError}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleSavePhone}
                                        disabled={savingPhone}
                                        className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
                                        title="Salvar">
                                        <Check size={16} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingPhone(false);
                                            setPhoneValue(user?.phone || '');
                                            setPhoneError('');
                                        }}
                                        className="p-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
                                        title="Cancelar">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-3">
                                    <Phone size={16} className="text-slate-600 shrink-0" />
                                    <span className="text-white font-medium text-sm flex-1">{user?.phone ? formatPhone(user.phone) : 'Não informado'}</span>
                                    <button
                                        onClick={() => {
                                            setEditingPhone(true);
                                            setPhoneValue(user?.phone || '');
                                        }}
                                        className="text-slate-500 hover:text-blue-400 p-1 rounded-lg hover:bg-white/5 transition-colors"
                                        title="Editar telefone">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <MapPin size={12} />
                                <span>Portal de Acessibilidade Urbana — Cidadão Informa</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
