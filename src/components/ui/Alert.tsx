import React from 'react';

interface AlertProps {
  variant?: 'success' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  className = '',
}) => {
  const variants = {
    success: 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
    error: 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
    info: 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  };

  return (
    <div
      className={`
        p-4 rounded-lg border border-solid
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

