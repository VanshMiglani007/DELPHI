import React from 'react';
import { motion } from 'framer-motion';

function getScoreColor(score) {
  if (score > 70) return '#4ade80';
  if (score >= 40) return '#facc15';
  return '#f87171';
}

const agentMeta = [
  { key: 'sentinel', label: 'SENTINEL', color: '#ef4444' },
  { key: 'stranger', label: 'STRANGER', color: '#3b82f6' },
  { key: 'oracle', label: 'ORACLE', color: '#f59e0b' },
];

export default function FinalVerdict({ verdict, onReset }) {
  if (!verdict) return null;

  const scores = verdict.scores || {};
  const overallScore = verdict.overallScore ?? verdict.score ?? 0;
  const overallColor = getScoreColor(overallScore);
  const sentence = verdict.sentence || verdict.summary || '';
  const survival = verdict.survivalProbability ?? verdict.survival ?? null;
  const fixes = verdict.fixes || verdict.topFixes || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        overflowY: 'auto',
        padding: '48px 24px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.3em',
            color: '#94a3b8',
            marginBottom: '40px',
          }}
        >
          DELPHI VERDICT
        </motion.div>

        {/* Three Score Circles */}
        <div
          style={{
            display: 'flex',
            gap: '48px',
            marginBottom: '48px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {agentMeta.map((agent, i) => {
            const agentScore = scores[agent.key] ?? 0;
            const scoreColor = getScoreColor(agentScore);

            return (
              <motion.div
                key={agent.key}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: `3px solid ${agent.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: 900,
                      color: scoreColor,
                    }}
                  >
                    {agentScore}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: agent.color,
                    textTransform: 'uppercase',
                  }}
                >
                  {agent.label}
                </span>
              </motion.div>
            );
          })}
        </div>

        {/* DELPHI Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 150 }}
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          <div
            className="score-pulse"
            style={{
              fontSize: '96px',
              fontWeight: 900,
              color: overallColor,
              lineHeight: 1,
            }}
          >
            {overallScore}
          </div>
          <div
            style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: '#94a3b8',
              marginTop: '8px',
            }}
          >
            DELPHI SCORE
          </div>
        </motion.div>

        {/* Verdict Sentence */}
        {sentence && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{
              fontStyle: 'italic',
              color: '#94a3b8',
              fontSize: '18px',
              textAlign: 'center',
              maxWidth: '600px',
              lineHeight: 1.6,
              marginBottom: '32px',
            }}
          >
            "{sentence}"
          </motion.p>
        )}

        {/* Survival Probability */}
        {survival !== null && survival !== undefined && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: getScoreColor(survival),
              marginBottom: '40px',
              textAlign: 'center',
            }}
          >
            {survival}% Survival Probability
          </motion.div>
        )}

        {/* Top Fixes */}
        {fixes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            style={{ width: '100%', marginBottom: '40px' }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#94a3b8',
                marginBottom: '16px',
                fontWeight: 700,
              }}
            >
              TOP FIXES
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              {fixes.slice(0, 5).map((fix, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.3 + i * 0.08 }}
                  style={{
                    background: '#13131a',
                    border: '1px solid #1e1e2e',
                    borderRadius: '8px',
                    padding: '16px',
                    flex: '1 1 calc(50% - 12px)',
                    minWidth: '250px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      marginBottom: '8px',
                    }}
                  >
                    {fix.title || fix.name || `Fix ${i + 1}`}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {fix.impact && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: '#1a2332',
                          color: '#60a5fa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Impact: {fix.impact}
                      </span>
                    )}
                    {fix.effort && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          background: '#1a1a2e',
                          color: '#a78bfa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Effort: {fix.effort}
                      </span>
                    )}
                  </div>
                  {fix.description && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#94a3b8',
                        marginTop: '8px',
                        lineHeight: 1.5,
                      }}
                    >
                      {fix.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Consult Again Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          onClick={onReset}
          style={{
            padding: '14px 40px',
            background: 'transparent',
            border: '1px solid #94a3b8',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '48px',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#f8fafc';
            e.target.style.color = '#f8fafc';
            e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.08)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#94a3b8';
            e.target.style.color = '#94a3b8';
            e.target.style.boxShadow = 'none';
          }}
        >
          CONSULT AGAIN
        </motion.button>
      </div>
    </motion.div>
  );
}
