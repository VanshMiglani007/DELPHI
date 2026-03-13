import { useState, useCallback, useRef, useEffect } from 'react';

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
  const [screen, setScreen] = useState('landing')
  const [sentinelData, setSentinelData] = useState({...initialAgentState})
  const [strangerData, setStrangerData] = useState({...initialAgentState})
  const [oracleData, setOracleData] = useState({...initialAgentState})
  const [metrics, setMetrics] = useState({
    endpoints: 0,
    vulnerabilities: 0,
    breakingPoint: null,
    uxFailures: 0,
    businessGaps: 0
  })
  const [verdict, setVerdict] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  const wsRefs = useRef({})

  const handleMessage = useCallback((agent, event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }

    const { type, content } = data

    const setAgentData = {
      sentinel: setSentinelData,
      stranger: setStrangerData,
      oracle: setOracleData
    }[agent]

    if (!setAgentData) return

    if (type === 'reasoning') {
      setAgentData(prev => ({
        ...prev,
        status: 'analyzing',
        reasoning: prev.reasoning + ' ' + (content.text || '')
      }))
    }

    if (type === 'finding') {
      setAgentData(prev => ({
        ...prev,
        findings: [...prev.findings, content]
      }))
      setMetrics(prev => ({
        ...prev,
        vulnerabilities: agent === 'sentinel' ? prev.vulnerabilities + 1 : prev.vulnerabilities,
        uxFailures: agent === 'stranger' ? prev.uxFailures + 1 : prev.uxFailures,
        businessGaps: agent === 'oracle' ? prev.businessGaps + 1 : prev.businessGaps
      }))
    }

    if (type === 'metric') {
      setMetrics(prev => ({
        ...prev,
        [content.category]: content.value
      }))
    }

    if (type === 'judgment') {
      setVerdict(content)
      setScreen('verdict')
    }
  }, [])

  const sendUrl = useCallback((url) => {
    setScreen('dashboard')
    
    // Reset state
    setSentinelData({...initialAgentState, status: 'analyzing'})
    setStrangerData({...initialAgentState, status: 'analyzing'})
    setOracleData({...initialAgentState, status: 'analyzing'})
    setMetrics({ endpoints: 0, vulnerabilities: 0, breakingPoint: null, uxFailures: 0, businessGaps: 0 })
    setVerdict(null)

    let connectedCount = 0
    const agents = ['sentinel', 'stranger', 'oracle']

    agents.forEach(agent => {
      const ws = new WebSocket(WS_URLS[agent])
      wsRefs.current[agent] = ws

      ws.onopen = () => {
        connectedCount++
        setConnectionStatus('connected')
        if (connectedCount === 3) {
          fetch('http://localhost:8000/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          })
        }
      }

      ws.onmessage = (event) => handleMessage(agent, event)

      ws.onerror = () => {
        setConnectionStatus('error')
      }

      ws.onclose = () => {
        connectedCount = Math.max(0, connectedCount - 1)
      }
    })
  }, [handleMessage])

  const resetAll = useCallback(() => {
    Object.values(wsRefs.current).forEach(ws => ws?.close())
    wsRefs.current = {}
    setScreen('landing')
    setSentinelData({...initialAgentState})
    setStrangerData({...initialAgentState})
    setOracleData({...initialAgentState})
    setMetrics({ endpoints: 0, vulnerabilities: 0, breakingPoint: null, uxFailures: 0, businessGaps: 0 })
    setVerdict(null)
    setConnectionStatus('disconnected')
  }, [])

  useEffect(() => {
    return () => {
      Object.values(wsRefs.current).forEach(ws => ws?.close())
    }
  }, [])

  return {
    screen,
    sendUrl,
    resetAll,
    sentinelData,
    strangerData,
    oracleData,
    metrics,
    verdict,
    connectionStatus
  }
}
