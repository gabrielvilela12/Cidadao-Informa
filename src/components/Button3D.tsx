import React from 'react';

type Variant = 'blue' | 'white' | 'red';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

export const Button3D: React.FC<Button3DProps> = ({
  variant = 'blue',
  children,
  className = '',
  disabled,
  ...rest
}) => {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`btn3d btn3d-${variant} ${className}`}
    >
      <span className="btn3d-shadow" />
      <span className="btn3d-edge" />
      <span className="btn3d-front">{children}</span>
    </button>
  );
};
