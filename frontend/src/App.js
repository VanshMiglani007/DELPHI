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
  } = useWebSocket();

  return (
    <>
      {screen === 'landing' && <Landing onSendUrl={sendUrl} onTestMode={startTestMode} />}
      {screen === 'dashboard' && (
        <Dashboard
          sentinelData={sentinelData}
          strangerData={strangerData}
          oracleData={oracleData}
          metrics={metrics}
          url={targetUrl}
        />
      )}
      {screen === 'verdict' && (
        <FinalVerdict verdict={verdict} onReset={resetAll} />
      )}
    </>
  );
}

export default App;
