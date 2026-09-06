import React from 'react';

function TypingIndicator({ typingUsers = [] }) {
  if (!typingUsers || typingUsers.length === 0) return null;

  let message = '';
  if (typingUsers.length === 1) {
    message = `${typingUsers[0].name} is typing...`;
  } else if (typingUsers.length === 2) {
    message = `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
  } else {
    message = `${typingUsers[0].name} and ${typingUsers.length - 1} others are typing...`;
  }

  return (
    <div className="fixed bottom-6 left-8 z-30 flex items-center gap-2.5 px-3.5 py-1.5 bg-dark-800/90 backdrop-blur-md border border-indigo-500/30 rounded-full shadow-lg shadow-indigo-500/10 text-xs text-gray-300 animate-fadeIn">
      {/* Animated Bouncing Dots */}
      <div className="flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
      </div>

      <span className="font-medium text-indigo-300">{message}</span>
    </div>
  );
}

export default React.memo(TypingIndicator);
