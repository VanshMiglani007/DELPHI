import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function getScoreColor(score) {
  if (score > 70) return '#4ade80';
  if (score >= 40) return '#facc15';
  return '#f87171';
}

function AnimatedScore({ value, delayMs = 0 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frameId;
    let startTime;
    let startVal = 0;

    const timeout = setTimeout(() => {
      startTime = performance.now();
      const animate = (now) => {
        const elapsed = now - startTime;
        const duration = 1500; // 1.5s for the count up
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(Math.round(startVal + (value - startVal) * eased));

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        }
      };
      frameId = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [value, delayMs]);

  return display;
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
  const verdictFixes = verdict.fixes || verdict.topFixes || [];
  const fixes = Array.isArray(verdictFixes) ? verdictFixes : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        overflowY: 'auto',
        padding: '48px 24px',
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          maxWidth: '900px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
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
            marginBottom: '20px',
          }}
        >
          DELPHI VERDICT
        </motion.div>

        {/* ANALYSIS COMPLETE Typewriter */}
        <div style={{ height: '30px', marginBottom: '20px' }}>
          <div
            className="typewriter-text"
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '0.15em',
            }}
          >
            ANALYSIS COMPLETE
          </div>
        </div>

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
            const delay = 1000 + i * 400; // stagger start times

            return (
              <motion.div
                key={agent.key}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay / 1000, type: 'spring', stiffness: 200, damping: 15 }}
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
                    boxShadow: `0 0 20px ${agent.color}20, inset 0 0 20px ${agent.color}20`,
                  }}
                >
                  <span
                    style={{
                      fontSize: '36px',
                      fontWeight: 900,
                      color: scoreColor,
                    }}
                  >
                    <AnimatedScore value={agentScore} delayMs={delay + 300} />
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

        {/* Horizontal drawing line before verdict */}
        <div
          style={{
            width: '100%',
            height: '1px',
            background: '#1e1e2e',
            marginBottom: '40px',
            position: 'relative',
          }}
        >
          <div
            className="draw-line"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
            }}
          />
        </div>

        {/* DELPHI Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.8, type: 'spring', stiffness: 150 }}
          style={{
            textAlign: 'center',
            marginBottom: '24px',
          }}
          className={overallScore < 50 ? 'shake-score' : ''}
        >
          <div
            className="score-pulse"
            style={{
              fontSize: '120px',
              fontWeight: 900,
              color: overallColor,
              lineHeight: 1,
            }}
          >
            <AnimatedScore value={overallScore} delayMs={2900} />
          </div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.3em',
              color: '#94a3b8',
              marginTop: '12px',
            }}
          >
            DELPHI SCORE
          </div>
        </motion.div>

        {/* Verdict Sentence */}
        {sentence && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5 }}
            style={{
              fontStyle: 'italic',
              color: '#f8fafc',
              fontSize: '20px',
              fontWeight: 600,
              textAlign: 'center',
              maxWidth: '640px',
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
            transition={{ delay: 5.5 }}
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: getScoreColor(survival),
              marginBottom: '48px',
              textAlign: 'center',
              textShadow: `0 0 20px ${getScoreColor(survival)}40`,
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
            transition={{ delay: 6 }}
            style={{ width: '100%', marginBottom: '60px' }}
          >
            <div
              style={{
                fontSize: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: '#94a3b8',
                marginBottom: '20px',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              CRITICAL INTERVENTIONS REQUIRED
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '16px',
                justifyContent: 'center',
              }}
            >
              {fixes.slice(0, 5).map((fix, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 6.2 + i * 0.15 }}
                  style={{
                    background: '#13131a',
                    border: '1px solid #1e1e2e',
                    borderLeft: `3px solid ${i === 0 ? '#ef4444' : '#3b82f6'}`,
                    borderRadius: '8px',
                    padding: '20px',
                    flex: '1 1 calc(50% - 16px)',
                    minWidth: '300px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: '#f8fafc',
                      marginBottom: '12px',
                    }}
                  >
                    {fix.title || fix.name || `Fix ${i + 1}`}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {fix.impact && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: '#1a2332',
                          color: '#60a5fa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Impact: {fix.impact}
                      </span>
                    )}
                    {fix.effort && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '4px 10px',
                          borderRadius: '4px',
                          background: '#1a1a2e',
                          color: '#a78bfa',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Effort: {fix.effort}
                      </span>
                    )}
                  </div>
                  {fix.description && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: '#94a3b8',
                        marginTop: '12px',
                        lineHeight: 1.6,
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
          transition={{ delay: 7.5 }}
          onClick={onReset}
          style={{
            padding: '16px 48px',
            background: 'transparent',
            border: '1px solid #94a3b8',
            borderRadius: '8px',
            color: '#94a3b8',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginBottom: '80px',
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#f8fafc';
            e.target.style.color = '#f8fafc';
            e.target.style.boxShadow = '0 0 30px rgba(255,255,255,0.1)';
            e.target.style.background = 'rgba(255,255,255,0.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#94a3b8';
            e.target.style.color = '#94a3b8';
            e.target.style.boxShadow = 'none';
            e.target.style.background = 'transparent';
          }}
        >
          CONSULT AGAIN
        </motion.button>
      </div>
    </motion.div>
  );
}
