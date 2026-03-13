import React from 'react';
import { motion } from 'framer-motion';

const severityStyles = {
  CRITICAL: {
    borderColor: '#ef4444',
    badgeBg: '#450a0a',
    badgeText: '#fca5a5',
  },
  HIGH: {
    borderColor: '#f97316',
    badgeBg: '#431407',
    badgeText: '#fdba74',
  },
  MEDIUM: {
    borderColor: '#eab308',
    badgeBg: '#422006',
    badgeText: '#fde047',
  },
  LOW: {
    borderColor: '#22d3ee',
    badgeBg: '#0c1a1a',
    badgeText: '#67e8f9',
  },
};

export default function FindingCard({ severity = 'MEDIUM', category = '', text = '' }) {
  const style = severityStyles[severity] || severityStyles.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{
        background: '#13131a',
        borderRadius: '8px',
        borderLeft: `3px solid ${style.borderColor}`,
        padding: '12px 14px',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span
          style={{
            background: style.badgeBg,
            color: style.badgeText,
            fontSize: '10px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {severity}
        </span>
        <span
          style={{
            fontSize: '10px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {category}
        </span>
      </div>
      <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.5', margin: 0 }}>
        {text}
      </p>
    </motion.div>
  );
}
