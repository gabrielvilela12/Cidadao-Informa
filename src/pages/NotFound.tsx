import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { CidadaoBrand } from '../components/CidadaoBrand';
import { Button3D } from '../components/Button3D';
import { useApp } from '../context/AppContext';

export function NotFound() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useApp();

  const homePath = !isAuthenticated ? '/' : role === 'citizen' ? '/' : '/admin';

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#080d12] text-white font-sans overflow-hidden">
      {/* Brand bar */}
      <div className="flex items-center px-6 md:px-12 h-16 border-b border-white/5">
        <CidadaoBrand />
      </div>

      <main className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Decorative background grid */}
        <div
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(#1351b4 1px, transparent 1px), linear-gradient(90deg, #1351b4 1px, transparent 1px)',
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center gap-6"
        >
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-xs font-semibold tracking-wide uppercase">
            <Compass size={14} />
            Erro 404
          </span>

          {/* Big 404 */}
          <h1 className="text-[8rem] sm:text-[10rem] md:text-[12rem] font-black tracking-tight leading-none select-none relative">
            <span className="hero-fill-word" aria-label="404">
              <span className="hero-fill-base" aria-hidden="true">404</span>
              <span className="hero-fill-overlay" aria-hidden="true">404</span>
            </span>
          </h1>

          <div className="flex flex-col gap-2 -mt-2">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Página não encontrada
            </h2>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              O endereço que você tentou acessar não existe, foi movido ou está temporariamente
              indisponível.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2 w-full sm:w-auto">
            <Button3D
              variant="white"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft size={16} />
              Voltar
            </Button3D>
            <Button3D
              variant="blue"
              onClick={() => navigate(homePath)}
              className="w-full sm:w-auto"
            >
              <Home size={16} />
              Ir para o início
            </Button3D>
          </div>

          {/* Helpful hint */}
          <p className="text-xs text-slate-500 mt-4">
            Se você acredita que isto é um erro, entre em contato pelo canal de suporte.
          </p>
        </motion.div>
      </main>

      <footer className="px-6 md:px-12 py-4 border-t border-white/5 text-center text-xs text-slate-500">
        Cidadão Informa · Portal de Acessibilidade Urbana
      </footer>
    </div>
  );
}
