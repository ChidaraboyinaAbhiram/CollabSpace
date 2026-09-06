import React from 'react';

/**
 * Aesthetic suspense spinner for lazy route transitions
 */
export default function LoadingSpinner({ message = 'Loading workspace...' }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        {/* Inner reverse spinner */}
        <div className="absolute w-8 h-8 rounded-full border-4 border-indigo-400/30 border-b-indigo-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-400 animate-pulse tracking-wide">
        {message}
      </p>
    </div>
  );
}
