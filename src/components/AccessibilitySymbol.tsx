import type { CSSProperties, ImgHTMLAttributes } from 'react';

type AccessibilitySymbolProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  size?: number;
};

export function AccessibilitySymbol({
  size = 24,
  className,
  alt = '',
  style,
  ...props
}: AccessibilitySymbolProps) {
  const imageStyle: CSSProperties = {
    width: size,
    height: size,
    ...style,
  };
  const ariaHidden = props['aria-hidden'] ?? (alt ? undefined : true);

  return (
    <img
      {...props}
      src="/accessibility-symbol.png"
      alt={alt}
      aria-hidden={ariaHidden}
      className={['shrink-0 object-contain', className].filter(Boolean).join(' ')}
      style={imageStyle}
      draggable={false}
    />
  );
}