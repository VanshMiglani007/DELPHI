import { useState, useCallback, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { runTestSimulation } from '../testSocket';

const AGENT_ENDPOINTS = {
  sentinel: 'ws://localhost:8000/ws/sentinel',
  stranger: 'ws://localhost:8000/ws/stranger',
  oracle: 'ws://localhost:8000/ws/oracle',
};

const initialAgentData = () => ({
  status: 'idle',
  reasoning: [],
  findings: [],
});

const initialMetrics = () => ({
  endpoints: 0,
  vulnerabilities: 0,
  breakingPoint: null,
  uxFailures: 0,
  businessGaps: 0,
});

export default function useWebSocket() {
  const [screen, setScreen] = useState('landing');
  const [sentinelData, setSentinelData] = useState(initialAgentData());
  const [strangerData, setStrangerData] = useState(initialAgentData());
  const [oracleData, setOracleData] = useState(initialAgentData());
  const [metrics, setMetrics] = useState(initialMetrics());
  const [offlineStatus, setOfflineStatus] = useState(null); // 'connecting', 'connected', 'error', 'disconnected'
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [backendConnectivity, setBackendConnectivity] = useState(null); // To track overall demo mode state
  const [verdict, setVerdict] = useState(null);
  const [targetUrl, setTargetUrl] = useState('');
  const socketsRef = useRef({});
  const testCleanupRef = useRef(null);

  const getAgentSetter = useCallback((agent) => {
    switch (agent) {
      case 'sentinel': return setSentinelData;
      case 'stranger': return setStrangerData;
      case 'oracle': return setOracleData;
      default: return null;
    }
  }, []);

  const handleMessage = useCallback((data) => {
    const { agent, type, content } = data;
    const setter = getAgentSetter(agent);

    if (type === 'reasoning' && setter) {
      setter((prev) => ({
        ...prev,
        status: 'analyzing',
        reasoning: [...prev.reasoning, content.text],
      }));
    }

    if (type === 'finding' && setter) {
      setter((prev) => ({
        ...prev,
        status: 'analyzing',
        findings: [...prev.findings, content],
      }));

      setMetrics((prev) => {
        const updated = { ...prev };
        const cat = (content.category || '').toLowerCase();

        if (cat.includes('endpoint')) updated.endpoints += 1;
        if (content.severity === 'CRITICAL' || content.severity === 'HIGH' || cat.includes('vuln')) {
          updated.vulnerabilities += 1;
        }
        if (cat.includes('ux') || cat.includes('experience') || cat.includes('usability')) {
          updated.uxFailures += 1;
        }
        if (cat.includes('business') || cat.includes('gap') || cat.includes('revenue')) {
          updated.businessGaps += 1;
        }

        return updated;
      });
    }

    if (type === 'metric') {
      setMetrics((prev) => {
        const updated = { ...prev };
        const cat = (content.category || '').toLowerCase();

        if (cat.includes('endpoint')) updated.endpoints = content.value;
        else if (cat.includes('vuln')) updated.vulnerabilities = content.value;
        else if (cat.includes('breaking') || cat.includes('load')) updated.breakingPoint = content.value;
        else if (cat.includes('ux') || cat.includes('experience')) updated.uxFailures = content.value;
        else if (cat.includes('business') || cat.includes('gap')) updated.businessGaps = content.value;

        return updated;
      });
    }

    if (type === 'judgment') {
      if (setter) {
        setter((prev) => ({ ...prev, status: 'complete' }));
      }
      setVerdict(content);
      setScreen('verdict');
    }
  }, [getAgentSetter]);

  const disconnectAll = useCallback(() => {
    Object.keys(socketsRef.current).forEach((agentName) => {
      const socket = socketsRef.current[agentName];
      if (socket) {
        socket.disconnect();
      }
    });
    socketsRef.current = {};

    if (testCleanupRef.current) {
      testCleanupRef.current();
      testCleanupRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnectAll();
    };
  }, [disconnectAll]);

  const resetAll = useCallback(() => {
    disconnectAll();

    setScreen('landing');
    setSentinelData(initialAgentData());
    setStrangerData(initialAgentData());
    setOracleData(initialAgentData());
    setMetrics(initialMetrics());
    setVerdict(null);
    setTargetUrl('');
    setBackendConnectivity(null);
    setOfflineStatus(null);
  }, [disconnectAll]);

  const startTestMode = useCallback((fallbackUrl = 'https://demo-startup.com') => {
    disconnectAll();

    setTargetUrl(fallbackUrl);
    setScreen('dashboard');
    setBackendConnectivity('error'); // demo mode active
    setSentinelData({ ...initialAgentData(), status: 'analyzing' });
    setStrangerData({ ...initialAgentData(), status: 'analyzing' });
    setOracleData({ ...initialAgentData(), status: 'analyzing' });
    setMetrics(initialMetrics());
    setVerdict(null);

    testCleanupRef.current = runTestSimulation(handleMessage);
  }, [handleMessage, disconnectAll]);

  const sendUrl = useCallback((url) => {
    setTargetUrl(url);
    setScreen('dashboard');

    setSentinelData({ ...initialAgentData(), status: 'analyzing' });
    setStrangerData({ ...initialAgentData(), status: 'analyzing' });
    setOracleData({ ...initialAgentData(), status: 'analyzing' });
    setMetrics(initialMetrics());
    setVerdict(null);

    // Disconnect any existing connections
    disconnectAll();

    // Connect to all 3 agent WebSockets simultaneously
    setOfflineStatus('connecting');
    setBackendConnectivity('connecting');
    let connectedCount = 0;
    let failedCount = 0;
    Object.entries(AGENT_ENDPOINTS).forEach(([agentName, endpoint]) => {
      try {
        const socket = io(endpoint, {
          transports: ['websocket'],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
        });

        socketsRef.current[agentName] = socket;

        socket.on('connect', () => {
          console.log(`[DELPHI] ${agentName.toUpperCase()} WebSocket connected`);
          connectedCount++;
          if (connectedCount === 3) {
            setOfflineStatus('connected');
            setBackendConnectivity('connected');
          }
          socket.emit('message', { url });
        });

        socket.on('message', (data) => {
          try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            handleMessage(parsed);
          } catch (err) {
            console.error(`[DELPHI] ${agentName.toUpperCase()} failed to parse message:`, err);
          }
        });

        socket.on('connect_error', (err) => {
          console.warn(`[DELPHI] ${agentName.toUpperCase()} connection error:`, err.message);
          failedCount++;
          // If any WebSocket fails, mark overall as error and trigger test mode
          if (failedCount === 1) { 
            setOfflineStatus('error');
            setBackendConnectivity('error');
            setShowOfflineToast(true);
            setTimeout(() => {
              setShowOfflineToast(false);
            }, 4000);
            
            // Automatically switch to demo mode after brief delay if connection fails
            setTimeout(() => {
              startTestMode(url);
            }, 500);
          }
        });

        socket.on('disconnect', (reason) => {
          console.log(`[DELPHI] ${agentName.toUpperCase()} disconnected:`, reason);
        });
      } catch (err) {
        console.error(`[DELPHI] ${agentName.toUpperCase()} socket initialization error:`, err);
      }
    });
  }, [handleMessage, disconnectAll, startTestMode]);

  return {
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
    offlineStatus,
    showOfflineToast,
    backendConnectivity,
  };
}
