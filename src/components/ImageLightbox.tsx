import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ImageLightboxProps = {
  src: string;
  alt: string;
  onClose: () => void;
};

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização ampliada de ${alt}`}
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Fechar imagem ampliada"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/55 text-white transition hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-white sm:right-7 sm:top-7"
      >
        <X size={24} />
      </button>

      <div className="flex max-h-full max-w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="max-h-[calc(100vh-4rem)] max-w-[calc(100vw-2rem)] rounded-lg object-contain shadow-2xl sm:max-h-[calc(100vh-6rem)] sm:max-w-[calc(100vw-6rem)]"
        />
      </div>
    </div>,
    document.body,
  );
}
