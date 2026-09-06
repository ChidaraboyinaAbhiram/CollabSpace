import React from 'react';

function Input({
  label,
  error,
  icon,
  className = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-gray-300 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`w-full bg-dark-900 border ${
            error ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-indigo-500/60'
          } rounded-xl ${
            icon ? 'pl-10' : 'px-4'
          } pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all ${className}`}
          {...props}
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default Input;
