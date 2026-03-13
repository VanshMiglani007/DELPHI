const testMessages = [
  {
    delay: 500,
    message: {
      agent: 'sentinel',
      type: 'reasoning',
      content: { text: 'Initializing attack sequence. Mapping target endpoints...' },
    },
  },
  {
    delay: 1000,
    message: {
      agent: 'stranger',
      type: 'reasoning',
      content: { text: 'Navigating target as confused first-time user...' },
    },
  },
  {
    delay: 1500,
    message: {
      agent: 'oracle',
      type: 'reasoning',
      content: { text: 'Analyzing business fundamentals and value proposition...' },
    },
  },
  {
    delay: 2000,
    message: {
      agent: 'sentinel',
      type: 'metric',
      content: { category: 'endpoints', value: 34 },
    },
  },
  {
    delay: 2500,
    message: {
      agent: 'sentinel',
      type: 'finding',
      content: {
        severity: 'CRITICAL',
        category: 'Missing Header',
        text: 'No Content Security Policy found. XSS attacks possible.',
      },
    },
  },
  {
    delay: 3000,
    message: {
      agent: 'sentinel',
      type: 'finding',
      content: {
        severity: 'HIGH',
        category: 'Load Test',
        text: 'System collapses at 847 concurrent users.',
      },
    },
  },
  {
    delay: 3500,
    message: {
      agent: 'sentinel',
      type: 'metric',
      content: { category: 'breakingPoint', value: 847 },
    },
  },
  {
    delay: 4000,
    message: {
      agent: 'stranger',
      type: 'finding',
      content: {
        severity: 'HIGH',
        category: 'UX Failure',
        text: 'CTA button not visible above fold. 68% of users leave immediately.',
      },
    },
  },
  {
    delay: 4500,
    message: {
      agent: 'stranger',
      type: 'finding',
      content: {
        severity: 'MEDIUM',
        category: 'Friction',
        text: 'Signup form has 11 required fields. Most users abandon at field 4.',
      },
    },
  },
  {
    delay: 5000,
    message: {
      agent: 'oracle',
      type: 'finding',
      content: {
        severity: 'HIGH',
        category: 'Business Gap',
        text: 'Value proposition unclear in first 8 seconds. No social proof visible.',
      },
    },
  },
  {
    delay: 5500,
    message: {
      agent: 'oracle',
      type: 'finding',
      content: {
        severity: 'MEDIUM',
        category: 'Conversion',
        text: 'Pricing page missing. Users cannot evaluate cost before signing up.',
      },
    },
  },
  {
    delay: 6000,
    message: {
      agent: 'sentinel',
      type: 'reasoning',
      content: { text: 'Load testing complete. Security scan finished. 4 vulnerabilities found.' },
    },
  },
  {
    delay: 7000,
    message: {
      agent: 'sentinel',
      type: 'judgment',
      content: {
        scores: { sentinel: 52, stranger: 38, oracle: 45 },
        overallScore: 46,
        sentence:
          'Strong server infrastructure undermined by critical security gaps and a UX flow that loses 70% of users before they reach the core product.',
        survivalProbability: 34,
        fixes: [
          { title: 'Add Content Security Policy header', impact: 'HIGH', effort: 'EASY' },
          { title: 'Move CTA above the fold', impact: 'HIGH', effort: 'EASY' },
          { title: 'Reduce signup form to 4 fields max', impact: 'HIGH', effort: 'MEDIUM' },
          { title: 'Add rate limiting to auth endpoints', impact: 'HIGH', effort: 'MEDIUM' },
          { title: 'Add pricing page with comparison table', impact: 'MEDIUM', effort: 'MEDIUM' },
        ],
      },
    },
  },
];

export function runTestSimulation(handleMessage) {
  const timers = [];

  testMessages.forEach(({ delay, message }) => {
    const timer = setTimeout(() => {
      handleMessage(message);
    }, delay);
    timers.push(timer);
  });

  return () => {
    timers.forEach((t) => clearTimeout(t));
  };
}
