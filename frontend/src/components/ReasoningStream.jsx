import React, { useRef, useEffect } from 'react';

export default function ReasoningStream({ reasoning = '', color = '#ef4444' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [reasoning]);

  const displayText = Array.isArray(reasoning) ? reasoning.join('\n') : (reasoning || '');

  return (
    <div
      ref={containerRef}
      style={{
        background: '#0d0d14',
        height: '180px',
        overflowY: 'auto',
        padding: '12px',
        borderRadius: '6px',
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '12px',
        lineHeight: '1.6',
        color: color,
        position: 'relative',
      }}
    >
      {displayText.length > 0 ? (
        <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {displayText}
          <span
            className="blink-cursor"
            style={{
              display: 'inline-block',
              width: '8px',
              height: '14px',
              backgroundColor: color,
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
            }}
          />
        </span>
      ) : (
        <span style={{ color: '#555', fontStyle: 'italic' }}>
          Awaiting signal...
          <span
            className="blink-cursor"
            style={{
              display: 'inline-block',
              width: '8px',
              height: '14px',
              backgroundColor: '#555',
              marginLeft: '2px',
              verticalAlign: 'text-bottom',
            }}
          />
        </span>
      )}
    </div>
  );
}
