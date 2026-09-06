import React from 'react';

// Generates dynamic gradient pairs deterministically from string
function getGradientFromName(name = '') {
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
    'from-violet-500 to-fuchsia-600'
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function Avatar({
  name = 'User',
  email = '',
  size = 'md',
  showTooltip = true,
  className = ''
}) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  const gradient = getGradientFromName(name || email);

  return (
    <div
      title={showTooltip ? `${name}${email ? ` (${email})` : ''}` : undefined}
      className={`relative inline-flex items-center justify-center rounded-full font-bold text-white bg-gradient-to-tr ${gradient} border-2 border-dark-900 shadow-md select-none shrink-0 ${sizeStyles[size]} ${className}`}
    >
      {initials}
    </div>
  );
}

export default Avatar;
