import React from 'react';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
    icon: 'p-2 rounded-xl'
  };

  const variantStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 border border-indigo-500/30',
    secondary: 'bg-dark-800 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10',
    danger: 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30',
    ghost: 'bg-transparent hover:bg-white/5 text-gray-400 hover:text-white border border-transparent',
    success: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
      ) : icon ? (
        <span className="text-base">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export default Button;
