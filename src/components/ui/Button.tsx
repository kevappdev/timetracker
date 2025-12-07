import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc] focus:ring-foreground',
    secondary: 'bg-zinc-100 text-foreground hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 focus:ring-zinc-500',
    outline: 'border border-solid border-black/[.08] dark:border-white/[.145] hover:border-transparent hover:bg-black/[.04] dark:hover:bg-[#1a1a1a] focus:ring-zinc-500'
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

