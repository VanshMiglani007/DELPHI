import React from 'react';
import useWebSocket from './hooks/useWebSocket';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import FinalVerdict from './components/FinalVerdict';

function App() {
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
    <>
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
          animation: 'item-show 0.3s ease-out'
        }}>
          ⚠️ Backend offline — running in demo mode
        </div>
      )}
      {screen === 'landing' && <Landing onSendUrl={sendUrl} onTestMode={startTestMode} backendConnectivity={backendConnectivity} />}
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
    </>
  );
}

export default App;
