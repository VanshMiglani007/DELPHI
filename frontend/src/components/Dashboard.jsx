import React, { useState, useEffect } from 'react';
import { Shield, User, Eye } from 'lucide-react';
import AgentPanel from './AgentPanel';
import MetricsBar from './MetricsBar';

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span style={{
      fontFamily: '"JetBrains Mono", monospace',
      fontSize: '12px',
      color: '#94a3b8',
      letterSpacing: '0.05em',
    }}>
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  );
}

export default function Dashboard({ sentinelData, strangerData, oracleData, metrics, url, backendConnectivity }) {
  const [logoHovered, setLogoHovered] = useState(false);

  const agentConfigs = [
    { name: 'SENTINEL', color: '#ef4444', icon: Shield, data: sentinelData },
    { name: 'STRANGER', color: '#3b82f6', icon: User, data: strangerData },
    { name: 'THE ORACLE', color: '#f59e0b', icon: Eye, data: oracleData },
  ];

  const anyAnalyzing = agentConfigs.some(a => a.data.status === 'analyzing');

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0a0a0f',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          height: '52px',
          background: '#13131a',
          borderBottom: '1px solid #1e1e2e',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        {/* Left: Logo */}
        <div
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          style={{
            fontWeight: 900,
            fontSize: '18px',
            color: '#f8fafc',
            letterSpacing: '0.1em',
            cursor: 'default',
            transition: 'all 0.3s ease',
            textShadow: logoHovered ? '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.3)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <img 
            src="/logo.png" 
            alt="" 
            style={{ 
              height: '28px', 
              width: '28px',
              borderRadius: '50%',
              objectFit: 'contain'
            }} 
          />
          DELPHI
        </div>

        {/* Center: URL + LIVE indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {anyAnalyzing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                className="live-dot"
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: backendConnectivity === 'error' ? '#ef4444' : backendConnectivity === 'connecting' ? '#f97316' : '#22c55e',
                  boxShadow: backendConnectivity === 'error' ? '0 0 10px #ef4444' : backendConnectivity === 'connecting' ? '0 0 10px #f97316' : '0 0 10px #22c55e',
                }}
              />
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: backendConnectivity === 'error' ? '#ef4444' : backendConnectivity === 'connecting' ? '#f97316' : '#22c55e',
                letterSpacing: '0.1em',
              }}>
                LIVE {backendConnectivity === 'error' && '(DEMO)'}
              </span>
            </div>
          )}
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '13px',
              color: '#94a3b8',
              maxWidth: '400px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: '#555' }}>ANALYZING: </span>
            {url}
          </div>
        </div>

        {/* Right: Status Dots + Clock */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {agentConfigs.map((agent) => (
              <div
                key={agent.name}
                className={agent.data.status === 'analyzing' ? 'pulse-dot' : ''}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background:
                    agent.data.status === 'analyzing'
                      ? agent.color
                      : agent.data.status === 'complete'
                      ? agent.color
                      : '#555',
                  opacity: agent.data.status === 'idle' ? 0.4 : 1,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
          <div style={{ width: '1px', height: '16px', background: '#2a2a3a' }} />
          <LiveClock />
        </div>
      </div>

      {/* Main: 3 Agent Panels */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: '12px',
          padding: '16px',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {agentConfigs.map((agent) => (
          <AgentPanel
            key={agent.name}
            name={agent.name}
            color={agent.color}
            icon={agent.icon}
            status={agent.data.status}
            reasoning={agent.data.reasoning}
            findings={agent.data.findings}
          />
        ))}
      </div>

      {/* Bottom: Metrics Bar */}
      <MetricsBar metrics={metrics} />
    </div>
  );
}
