import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className = '', id, ...props }) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-text-muted dark:text-zinc-500">{label}</label>}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
            {icon}
          </div>
        )}
        <input 
          id={inputId}
          className={`
            w-full rounded-md border bg-transparent text-text-DEFAULT dark:text-text-dark
            ${icon ? 'pl-10' : 'px-3'} py-2
            focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary
            disabled:opacity-50 disabled:cursor-not-allowed
            placeholder:text-text-muted/60 dark:placeholder:text-zinc-600
            transition-all duration-200 shadow-sm
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-border dark:border-border-dark group-hover:border-zinc-400 dark:group-hover:border-zinc-600'
            }
            ${className}
          `}
          {...props} 
        />
      </div>
      {error && <p className="text-xs text-red-500 animate-slide-up">{error}</p>}
    </div>
  );
};