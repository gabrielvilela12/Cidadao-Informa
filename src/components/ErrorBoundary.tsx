/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary para capturar erros não tratados e impedir tela branca.
 * Exibe uma mensagem de erro amigável em vez de crashar silenciosamente.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Erro capturado:', error, info.componentStack);
    }

    render() {
        if ((this.state as ErrorBoundaryState).hasError) {
            if (this.props.fallback) return this.props.fallback;

            const error = (this.state as ErrorBoundaryState).error;

            return (
                <div
                    style={{
                        minHeight: '100vh',
                        backgroundColor: '#101922',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontFamily: 'Inter, sans-serif',
                        padding: '2rem',
                        textAlign: 'center',
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Algo deu errado
                    </h1>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem', maxWidth: '480px' }}>
                        Ocorreu um erro inesperado. Tente recarregar a página.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            backgroundColor: '#2563eb',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.75rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Recarregar página
                    </button>
                    {(import.meta as any).env?.DEV && error && (
                        <pre
                            style={{
                                marginTop: '1.5rem',
                                padding: '1rem',
                                backgroundColor: '#1e293b',
                                borderRadius: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#f87171',
                                textAlign: 'left',
                                maxWidth: '600px',
                                overflow: 'auto',
                            }}
                        >
                            {error.message}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
