import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback seguro para quando as variáveis de ambiente não estão configuradas
// Evita que o app quebre com tela branca em produção
const FALLBACK_URL = 'https://pjbxfuxhdtpoifetxmha.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqYnhmdXhoZHRwb2lmZXR4bWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3NjUxNzUsImV4cCI6MjA4NzM0MTE3NX0.EDI5XT7T1S-_OzO15hOzd9Ve5_3FM-iFnAm-D1TYB6E';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
        '[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos. ' +
        'Usando credenciais de fallback. Configure as variáveis de ambiente em produção.'
    );
}

export const supabase: SupabaseClient = createClient(
    SUPABASE_URL || FALLBACK_URL,
    SUPABASE_ANON_KEY || FALLBACK_KEY
);
