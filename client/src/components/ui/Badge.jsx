import React from 'react';

function Badge({
  children,
  variant = 'neutral',
  dot = false,
  className = ''
}) {
  const variantStyles = {
    neutral: 'bg-white/5 border-white/10 text-gray-300',
    primary: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
    success: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    warning: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    danger: 'bg-red-500/15 border-red-500/30 text-red-300'
  };

  const dotColors = {
    neutral: 'bg-gray-400',
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${variantStyles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
}

export default Badge;
