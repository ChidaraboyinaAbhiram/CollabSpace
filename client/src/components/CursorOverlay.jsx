import React, { useEffect, useState } from 'react';

function CursorOverlay({ cursors = {}, quillRef }) {
  const [positions, setPositions] = useState([]);

  // Recalculate pixel bounds for all remote cursors
  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current.getEditor();

    const calculated = Object.entries(cursors).map(([userId, cursorData]) => {
      try {
        const { range, user } = cursorData;
        if (!range || typeof range.index !== 'number') return null;

        // Quill getBounds calculates exact pixel { left, top, height }
        const bounds = editor.getBounds(range.index);
        if (!bounds) return null;

        return {
          userId,
          name: user?.name || 'Collaborator',
          color: user?.color || '#6366f1',
          top: bounds.top,
          left: bounds.left,
          height: bounds.height || 20
        };
      } catch (err) {
        return null;
      }
    }).filter(Boolean);

    setPositions(calculated);
  }, [cursors, quillRef]);

  if (positions.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {positions.map((pos) => (
        <div
          key={pos.userId}
          className="absolute transition-all duration-100 ease-out"
          style={{
            top: `${pos.top}px`,
            left: `${pos.left}px`
          }}
        >
          {/* Vertical Colored Cursor Carat Line */}
          <div
            className="w-0.5 rounded-full"
            style={{
              backgroundColor: pos.color,
              height: `${pos.height}px`
            }}
          ></div>

          {/* Floating User Name Tag */}
          <div
            className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-md whitespace-nowrap select-none animate-fadeIn"
            style={{ backgroundColor: pos.color }}
          >
            {pos.name}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CursorOverlay;
