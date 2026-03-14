import React, { useState } from 'react';
import useWebSocket from './hooks/useWebSocket';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import FinalVerdict from './components/FinalVerdict';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  const {
    screen,
    sendUrl,
    resetAll,
    startTestMode,
    sentinelData,
    strangerData,
    oracleData,
    metrics,
    verdict,
    targetUrl,
    backendConnectivity,
    showOfflineToast,
  } = useWebSocket();

  return (
    <div className={darkMode ? 'theme-dark' : 'theme-light'}>
      {/* Toggle button */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        style={{
          position: 'fixed',
          top: '16px',
          right: '20px',
          zIndex: 10000,
          background: darkMode ? '#1e293b' : '#e2e8f0',
          border: darkMode ? '1px solid #334155' : '1px solid #cbd5e1',
          borderRadius: '20px',
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: '16px',
          color: darkMode ? '#f8fafc' : '#0f172a',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {darkMode ? '☀️ Light' : '🌙 Dark'}
      </button>

      {showOfflineToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'rgba(249, 115, 22, 0.15)',
          border: '1px solid #f97316',
          borderRadius: '8px',
          padding: '12px 20px',
          color: '#f97316',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 0 20px rgba(249, 115, 22, 0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          ⚠️ Backend offline — running in demo mode
        </div>
      )}

      {screen === 'landing' && <Landing onSendUrl={sendUrl} onTestMode={startTestMode} backendConnectivity={backendConnectivity} darkMode={darkMode} />}
      {screen === 'dashboard' && (
        <Dashboard
          sentinelData={sentinelData}
          strangerData={strangerData}
          oracleData={oracleData}
          metrics={metrics}
          url={targetUrl}
          backendConnectivity={backendConnectivity}
        />
      )}
      {screen === 'verdict' && (
        <FinalVerdict verdict={verdict} onReset={resetAll} />
      )}
    </div>
  );
}

export default App;