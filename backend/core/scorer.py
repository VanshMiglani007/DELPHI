def calculate_agent_score(findings):
    score = 100
    for finding in findings:
        severity = finding.get('severity', 'LOW')
        if severity == 'CRITICAL':
            score -= 20
        elif severity == 'HIGH':
            score -= 10
        elif severity == 'MEDIUM':
            score -= 5
        elif severity == 'LOW':
            score -= 2
    return max(0, score)

def calculate_delphi_score(sentinel, stranger, oracle):
    return int((sentinel * 0.4) + (stranger * 0.3) + (oracle * 0.3))

def calculate_survival_probability(delphi_score):
    return max(0, delphi_score - 10)

def generate_fixes(findings):
    fixes = []
    for f in findings[:5]:
        fixes.append({
            "what": f"Fix {f.get('text', 'Issue')}",
            "why": "Improves overall score and usability",
            "impact": 5,
            "effort": "MEDIUM"
        })
    return fixes
