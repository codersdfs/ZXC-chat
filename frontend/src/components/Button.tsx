import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({ children, onClick, type = 'button', variant = 'primary', disabled, className }) => {
  const baseClasses = 'px-4 py-2 rounded font-medium';
  const variantClasses = variant === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
  return (
    <button className={`${baseClasses} ${variantClasses} ${className || ''}`} onClick={onClick} type={type} disabled={disabled}>
      {children}
    </button>
  );
};