import React from 'react';
import { Shield, User, Eye } from 'lucide-react';
import AgentPanel from './AgentPanel';
import MetricsBar from './MetricsBar';

export default function Dashboard({ sentinelData, strangerData, oracleData, metrics, url }) {
  const agentConfigs = [
    { name: 'SENTINEL', color: '#ef4444', icon: Shield, data: sentinelData },
    { name: 'STRANGER', color: '#3b82f6', icon: User, data: strangerData },
    { name: 'THE ORACLE', color: '#f59e0b', icon: Eye, data: oracleData },
  ];

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
          style={{
            fontWeight: 900,
            fontSize: '18px',
            color: '#f8fafc',
            letterSpacing: '0.1em',
          }}
        >
          DELPHI
        </div>

        {/* Center: URL */}
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

        {/* Right: Status Dots */}
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
