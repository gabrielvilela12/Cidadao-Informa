import React, { useState } from 'react';
import { MapIcon, User, Shield, Key, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

export function Login() {
    const { setRole } = useApp();
    const navigate = useNavigate();

    const [isRegistering, setIsRegistering] = useState(false);
    const [cpf, setCpf] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [adminPassword, setAdminPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [errorDesc, setErrorDesc] = useState('');

    const [authMode, setAuthMode] = useState<'citizen' | 'admin'>('citizen');

    // Strip punctuation from CPF for the pseudo-email
    const sanitizeCPF = (raw: string) => raw.replace(/\D/g, '');

    const formatCPF = (val: string) => {
        return val
            .replace(/\D/g, "")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
            .slice(0, 14);
    };

    const handleCitizenAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorDesc('');
        setLoading(true);

        const cleanCpf = sanitizeCPF(cpf);

        if (isRegistering && cleanCpf.length !== 11) {
            setErrorDesc('O CPF deve ter 11 dígitos.');
            setLoading(false);
            return;
        }

        if (!email || !email.includes('@')) {
            setErrorDesc('Por favor, informe um e-mail válido.');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setErrorDesc('A senha deve ter pelo menos 6 caracteres.');
            setLoading(false);
            return;
        }

        try {
            if (isRegistering) {
                if (!name.trim()) {
                    setErrorDesc('O Nome Completo é obrigatório para cadastro.');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        data: {
                            cpf: cleanCpf,
                            full_name: name,
                            role: 'citizen'
                        }
                    }
                });

                if (error) throw error;

                // Supabase auto-logs-in if email confirmation is off, AppContext will trigger redirect.
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;
                // AppContext handles the session
            }
        } catch (err: any) {
            console.error(err);
            if (err.message?.includes('Invalid login credentials')) {
                setErrorDesc('Email ou senha inválidos.');
            } else if (err.message?.includes('User already registered') || err.status === 422) {
                setErrorDesc('Já existe uma conta com este E-mail.');
            } else if (err.message?.includes('Email not confirmed')) {
                setErrorDesc('E-mail não confirmado. Verifique a caixa de entrada ou desative a confirmação no painel do Supabase.');
            } else {
                setErrorDesc('Erro na autenticação. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Keep admin mock for now
    const handleAdminMock = (e: React.FormEvent) => {
        e.preventDefault();
        setRole('admin');
        navigate('/admin');
    };

    return (
        <div className="min-h-screen bg-[#101922] flex flex-col justify-center items-center p-4 font-sans text-slate-200">
            <div className="w-full max-w-md bg-[#111418] border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">

                <div className="flex flex-col items-center mb-8 relative z-10">
                    <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-500 mb-4 ring-1 ring-blue-500/50">
                        <MapIcon size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">HackGov PCD</h1>
                    <p className="text-slate-400 text-center text-sm">Portal Inclusivo de Zeladoria Urbana</p>
                </div>

                {/* Toggle Citizen / Admin */}
                <div className="flex bg-[#1a2128] p-1 rounded-xl mb-6 relative z-10 border border-slate-800">
                    <button
                        onClick={() => setAuthMode('citizen')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 ${authMode === 'citizen' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <User size={16} /> Cidadão
                    </button>
                    <button
                        onClick={() => setAuthMode('admin')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex justify-center items-center gap-2 ${authMode === 'admin' ? 'bg-slate-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        <Shield size={16} /> Servidor
                    </button>
                </div>

                {errorDesc && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 justify-center rounded-lg mb-6 flex text-center animate-pulse">
                        {errorDesc}
                    </div>
                )}

                {authMode === 'citizen' ? (
                    <form onSubmit={handleCitizenAuth} className="flex flex-col gap-4 relative z-10">
                        {isRegistering && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Nome Completo</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <FileText size={18} className="text-slate-500" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[#1c2632] border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            placeholder="Ex: João da Silva"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">CPF</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <User size={18} className="text-slate-500" />
                                        </div>
                                        <input
                                            type="text"
                                            required
                                            value={cpf}
                                            onChange={(e) => setCpf(formatCPF(e.target.value))}
                                            className="w-full bg-[#1c2632] border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            placeholder="000.000.000-00"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">E-mail</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#1c2632] border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="seu@email.com"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Key size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#1c2632] border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    {isRegistering ? 'Criar Conta' : 'Acessar'}
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => { setIsRegistering(!isRegistering); setErrorDesc(''); }}
                                className="text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                {isRegistering ? 'Já possui conta? Faça login' : 'Primeiro acesso? Crie sua conta'}
                            </button>
                        </div>
                    </form>

                ) : (

                    <form onSubmit={handleAdminMock} className="flex flex-col gap-4 relative z-10">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1">Chave de Servidor</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Shield size={18} className="text-amber-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    className="w-full bg-[#1c2632] border border-slate-700 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-shadow"
                                    placeholder="Insira qualquer senha"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="mt-2 w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-3.5 rounded-xl font-bold transition-all group"
                        >
                            Acessar Painel
                        </button>
                        <div className="mt-2 text-center text-xs text-amber-500/80">
                            <p>Funcionalidade de Gestão restrita a Auditores.</p>
                        </div>
                    </form>

                )}

            </div>
        </div>
    );
}
