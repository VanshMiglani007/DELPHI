import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, User, Eye } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const agents = [
  {
    name: 'SENTINEL',
    icon: Shield,
    color: '#ef4444',
    desc: 'Security & Load Testing',
  },
  {
    name: 'STRANGER',
    icon: User,
    color: '#3b82f6',
    desc: 'Human Experience',
  },
  {
    name: 'THE ORACLE',
    icon: Eye,
    color: '#f59e0b',
    desc: 'Business Intelligence',
  },
];

function AgentCard({ agent }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        background: '#13131a',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        transition: 'all 0.3s ease',
        boxShadow: hovered
          ? `0 0 25px ${agent.color}30, inset 0 0 20px ${agent.color}08`
          : 'none',
        border: hovered
          ? `1px solid ${agent.color}40`
          : '1px solid transparent',
        borderLeft: `3px solid ${agent.color}`,
        cursor: 'default',
      }}
    >
      <agent.icon size={22} color={agent.color} />
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#f8fafc',
          textAlign: 'center',
        }}
      >
        {agent.name}
      </span>
      <span
        style={{
          fontSize: '10px',
          color: '#94a3b8',
          textAlign: 'center',
          lineHeight: 1.4,
        }}
      >
        {agent.desc}
      </span>
    </div>
  );
}

export default function Landing({ onSendUrl, onTestMode, backendConnectivity }) {
  const [url, setUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onSendUrl(url.trim());
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0f',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated dot grid background */}
      <div
        className="grid-bg"
        style={{
          position: 'absolute',
          inset: '-40px',
          opacity: 0.3,
          zIndex: 0,
        }}
      />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '640px',
          padding: '0 24px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Title with breathing glow */}
        <motion.div variants={item} style={{ position: 'relative' }}>
          {/* Red glow behind title */}
          <div
            className="title-glow-bg"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '400px',
              height: '120px',
              background: 'radial-gradient(ellipse, rgba(239,68,68,0.12) 0%, transparent 70%)',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
          <h1
            style={{
              fontSize: '96px',
              fontWeight: 900,
              letterSpacing: '0.3em',
              color: '#ffffff',
              textShadow: '0 0 60px rgba(255,255,255,0.15)',
              margin: 0,
              lineHeight: 1,
              position: 'relative',
            }}
          >
            DELPHI
          </h1>
        </motion.div>

        {/* Tagline */}
        <motion.p
          variants={item}
          style={{
            fontSize: '18px',
            color: '#94a3b8',
            letterSpacing: '0.15em',
            marginTop: '16px',
          }}
        >
          Three minds. One truth.
        </motion.p>

        {/* Divider */}
        <motion.div
          variants={item}
          style={{
            width: '60px',
            height: '1px',
            background: '#333',
            margin: '32px auto',
          }}
        />

        {/* Form */}
        <motion.form
          variants={item}
          onSubmit={handleSubmit}
          style={{ width: '100%', maxWidth: '560px' }}
        >
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://yourstartup.com"
            style={{
              width: '100%',
              padding: '16px 20px',
              background: '#13131a',
              border: backendConnectivity === 'error' ? '1px solid #f97316' : '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '15px',
              fontFamily: '"JetBrains Mono", monospace',
              outline: 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = backendConnectivity === 'error' ? '#f97316' : '#ffffff';
              e.target.style.boxShadow = backendConnectivity === 'error' ? '0 0 20px rgba(249,115,22,0.15)' : '0 0 20px rgba(255,255,255,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = backendConnectivity === 'error' ? 'rgba(249,115,22,0.5)' : '#2a2a3a';
              e.target.style.boxShadow = 'none';
            }}
          />

          <button
            type="submit"
            disabled={!url.trim()}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '16px',
              background: url.trim() ? '#ef4444' : '#2a2a2a',
              border: 'none',
              borderRadius: '8px',
              color: url.trim() ? '#ffffff' : '#666',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              cursor: url.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              boxShadow: url.trim() ? '0 0 30px rgba(239,68,68,0.25)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (url.trim()) {
                e.target.style.boxShadow = '0 0 50px rgba(239,68,68,0.4)';
                e.target.style.background = '#dc2626';
              }
            }}
            onMouseLeave={(e) => {
              if (url.trim()) {
                e.target.style.boxShadow = '0 0 30px rgba(239,68,68,0.25)';
                e.target.style.background = '#ef4444';
              }
            }}
          >
            {backendConnectivity === 'error' ? 'CONSULT THE ORACLE (DEMO MODE)' : 'CONSULT THE ORACLE'}
          </button>
          
          {backendConnectivity === 'error' && (
            <div style={{
              width: '100%',
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '12px',
              color: '#f97316',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <span style={{ fontSize: '14px' }}>⚡</span> Live backend offline — demo mode active
            </div>
          )}

          <button
            type="button"
            onClick={onTestMode}
            style={{
              width: '100%',
              marginTop: '10px',
              padding: '10px',
              background: 'transparent',
              border: '1px solid #2a2a3a',
              borderRadius: '6px',
              color: '#555',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#555';
              e.target.style.color = '#94a3b8';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#2a2a3a';
              e.target.style.color = '#555';
            }}
          >
            TEST MODE
          </button>
        </motion.form>

        {/* Agent Preview Cards */}
        <motion.div
          variants={item}
          style={{
            display: 'flex',
            gap: '16px',
            marginTop: '48px',
            width: '100%',
            maxWidth: '560px',
          }}
        >
          {agents.map((agent) => (
            <AgentCard key={agent.name} agent={agent} />
          ))}
        </motion.div>
      </motion.div>

      {/* Version tag */}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '24px',
          fontSize: '10px',
          color: '#333',
          letterSpacing: '0.1em',
          fontFamily: '"JetBrains Mono", monospace',
          zIndex: 2,
        }}
      >
        DELPHI v1.0
      </div>
    </div>
  );
}
