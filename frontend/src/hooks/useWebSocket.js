import { useState, useCallback, useRef, useEffect } from 'react';
import { runTestSimulation } from '../testSocket';

const WS_URLS = {
  sentinel: 'ws://localhost:8000/ws/sentinel',
  stranger: 'ws://localhost:8000/ws/stranger',
  oracle: 'ws://localhost:8000/ws/oracle'
}

const initialAgentState = {
  status: 'idle',
  reasoning: '',
  findings: []
}

export default function useWebSocket() {
  const [screen, setScreen] = useState('landing');
  const [targetUrl, setTargetUrl] = useState('');
  const [sentinelData, setSentinelData] = useState({ ...initialAgentState });
  const [strangerData, setStrangerData] = useState({ ...initialAgentState });
  const [oracleData, setOracleData] = useState({ ...initialAgentState });
  const [metrics, setMetrics] = useState({
    endpoints: 0,
    vulnerabilities: 0,
    breakingPoint: null,
    uxFailures: 0,
    businessGaps: 0
  });
  const [verdict, setVerdict] = useState(null);
  const [backendConnectivity, setBackendConnectivity] = useState('connected');
  const [showOfflineToast, setShowOfflineToast] = useState(false);

  const wsRefs = useRef({});
  const testTimerRef = useRef(null);

  useEffect(() => {
  }, []);

  const handleMessage = useCallback((data) => {
    const { agent, type, content } = data;

    const setAgentData = {
      sentinel: setSentinelData,
      stranger: setStrangerData,
      oracle: setOracleData
    }[agent];

    if (!setAgentData && agent !== 'system') return;

    if (type === 'reasoning') {
      setAgentData(prev => ({
        ...prev,
        status: 'analyzing',
        reasoning: prev.reasoning + ' \n' + (content.text || '')
      }));
    }

    if (type === 'finding') {
      setAgentData(prev => {
        if (prev.findings.some(f => f.text === content.text)) return prev;
        return {
          ...prev,
          findings: [...prev.findings, content]
        }
      });

      setMetrics(prev => ({
        ...prev,
        vulnerabilities: agent === 'sentinel' ? prev.vulnerabilities + 1 : prev.vulnerabilities,
        uxFailures: agent === 'stranger' ? prev.uxFailures + 1 : prev.uxFailures,
        businessGaps: agent === 'oracle' ? prev.businessGaps + 1 : prev.businessGaps
      }));
    }

    if (type === 'metric') {
      setMetrics(prev => ({
        ...prev,
        [content.category]: content.value
      }));
    }

    if (type === 'judgment') {
      setVerdict(content);
      setScreen('verdict');
    }
  }, []);

  const startTestMode = useCallback(() => {
    setScreen('dashboard');
    setTargetUrl('https://demo.delphi.run (Simulation)');
    setSentinelData({ ...initialAgentState, status: 'analyzing' });
    setStrangerData({ ...initialAgentState, status: 'analyzing' });
    setOracleData({ ...initialAgentState, status: 'analyzing' });
    setMetrics({ endpoints: 0, vulnerabilities: 0, breakingPoint: null, uxFailures: 0, businessGaps: 0 });
    setVerdict(null);

    const cleanup = runTestSimulation(handleMessage);
    testTimerRef.current = cleanup;
  }, [handleMessage]);

  const sendUrl = useCallback((url) => {
    setTargetUrl(url);
    setScreen('dashboard');

    setSentinelData({ ...initialAgentState, status: 'analyzing' });
    setStrangerData({ ...initialAgentState, status: 'analyzing' });
    setOracleData({ ...initialAgentState, status: 'analyzing' });
    setMetrics({ endpoints: 0, vulnerabilities: 0, breakingPoint: null, uxFailures: 0, businessGaps: 0 });
    setVerdict(null);

    let connectedCount = 0;
    const agents = ['sentinel', 'stranger', 'oracle'];

    const fallbackTimer = setTimeout(() => {
      if (connectedCount < 3) {
        console.warn("Connection timeout - falling back to demo mode");
        setShowOfflineToast(true);
        setTimeout(() => setShowOfflineToast(false), 4000);
        startTestMode();
      }
    }, 40000);

    agents.forEach(agent => {
      const ws = new WebSocket(WS_URLS[agent]);
      wsRefs.current[agent] = ws;

      ws.onopen = () => {
        setBackendConnectivity('connected');
        connectedCount++;
        if (connectedCount === 3) {
          clearTimeout(fallbackTimer);
          fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          }).catch(err => {
            console.error("Failed to trigger analysis", err);
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (e) {
          console.error("Failed to parse WS message", e);
        }
      };

      ws.onerror = () => setBackendConnectivity('error');

      ws.onclose = () => {
        console.log(`${agent} connection closed`);
      };
    });
  }, [handleMessage, backendConnectivity, startTestMode]);

  const resetAll = useCallback(() => {
    Object.values(wsRefs.current).forEach(ws => ws?.close());
    wsRefs.current = {};
    if (testTimerRef.current) testTimerRef.current();
    testTimerRef.current = null;

    setScreen('landing');
    setTargetUrl('');
    setSentinelData({ ...initialAgentState });
    setStrangerData({ ...initialAgentState });
    setOracleData({ ...initialAgentState });
    setMetrics({ endpoints: 0, vulnerabilities: 0, breakingPoint: null, uxFailures: 0, businessGaps: 0 });
    setVerdict(null);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(wsRefs.current).forEach(ws => ws?.close());
      if (testTimerRef.current) testTimerRef.current();
    };
  }, []);

  return {
    screen,
    sendUrl,
    startTestMode,
    resetAll,
    sentinelData,
    strangerData,
    oracleData,
    metrics,
    verdict,
    targetUrl,
    backendConnectivity,
    showOfflineToast
  };
}