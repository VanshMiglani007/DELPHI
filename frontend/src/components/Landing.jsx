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

export default function Landing({ onSendUrl, onTestMode }) {
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
      }}
    >
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
        }}
      >
        {/* Title */}
        <motion.h1
          variants={item}
          style={{
            fontSize: '96px',
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#ffffff',
            textShadow: '0 0 60px rgba(255,255,255,0.15)',
            margin: 0,
            lineHeight: 1,
          }}
        >
          DELPHI
        </motion.h1>

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
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '15px',
              fontFamily: '"JetBrains Mono", monospace',
              outline: 'none',
              transition: 'border 0.2s ease, box-shadow 0.2s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#ffffff';
              e.target.style.boxShadow = '0 0 20px rgba(255,255,255,0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#2a2a3a';
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
            CONSULT THE ORACLE
          </button>
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
            <div
              key={agent.name}
              style={{
                flex: 1,
                background: '#13131a',
                borderRadius: '8px',
                borderLeft: `3px solid ${agent.color}`,
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
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
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
