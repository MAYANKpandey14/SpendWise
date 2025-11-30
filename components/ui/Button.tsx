import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  isLoading,
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    // Notion Primary: often black/dark gray or a specific blue. Using Black/White for max minimalism.
    primary: "bg-[#2383e2] text-white hover:bg-[#1a6ebd] shadow-sm dark:bg-[#2383e2] dark:hover:bg-[#318ef0]",
    secondary: "bg-bg-subtle text-text-DEFAULT border border-border hover:bg-[#eaeaea] dark:bg-bg-subtle-dark dark:border-border-dark dark:text-text-dark dark:hover:bg-[#2a2a2a]",
    outline: "border border-border text-text-DEFAULT hover:bg-bg-subtle dark:border-border-dark dark:text-text-dark dark:hover:bg-bg-subtle-dark",
    ghost: "hover:bg-bg-subtle text-text-muted hover:text-text-DEFAULT dark:hover:bg-bg-subtle-dark dark:text-text-dark",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
  };

  const sizes = {
    sm: "h-7 px-2 text-xs",
    md: "h-9 px-3 text-sm",
    lg: "h-11 px-6 text-base",
    icon: "h-9 w-9 p-1.5"
  };

  if (typeof children === 'string' && children.includes('Sign in')) {
      console.log('Button: render', { children, disabled, isLoading });
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : null}
      {children}
    </button>
  );
};