import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      <input
        className={`
          w-full px-4 py-3 rounded-lg border border-solid
          border-black/[.08] dark:border-white/[.145]
          bg-background text-foreground
          focus:outline-none focus:ring-2 focus:ring-foreground focus:border-transparent
          transition-colors
          placeholder:text-zinc-500 dark:placeholder:text-zinc-400
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

