import React, { useEffect, useState, useRef } from 'react';

function AnimatedNumber({ value, duration = 600 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);
  const startRef = useRef(null);
  const fromRef = useRef(0);

  useEffect(() => {
    if (value === null || value === undefined) return;

    fromRef.current = display;
    startRef.current = performance.now();

    const animate = (now) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplay(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return display;
}

export default function MetricsBar({ metrics }) {
  const items = [
    {
      label: 'ENDPOINTS FOUND',
      value: metrics.endpoints,
      color: '#f8fafc',
    },
    {
      label: 'VULNERABILITIES',
      value: metrics.vulnerabilities,
      color: metrics.vulnerabilities > 0 ? '#ef4444' : '#f8fafc',
    },
    {
      label: 'BREAKING POINT',
      value: metrics.breakingPoint,
      color: '#f8fafc',
      isBreaking: true,
    },
    {
      label: 'UX FAILURES',
      value: metrics.uxFailures,
      color: '#f8fafc',
    },
    {
      label: 'BUSINESS GAPS',
      value: metrics.businessGaps,
      color: '#f8fafc',
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        background: '#13131a',
        borderTop: '1px solid #1e1e2e',
        padding: '16px 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}
    >
      {items.map((m) => (
        <div
          key={m.label}
          style={{
            textAlign: 'center',
            flex: 1,
          }}
        >
          <div
            style={{
              fontSize: '28px',
              fontWeight: 900,
              color: m.color,
              lineHeight: 1,
              marginBottom: '6px',
            }}
          >
            {m.isBreaking ? (
              m.value === null || m.value === undefined ? (
                '—'
              ) : (
                <>
                  <AnimatedNumber value={m.value} /> users
                </>
              )
            ) : (
              <AnimatedNumber value={m.value || 0} />
            )}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
            }}
          >
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}
