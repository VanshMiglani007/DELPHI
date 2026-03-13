async def mock_llama3_vision(screenshot_path):
    return {
        "value_proposition_unclear": False,
        "time_to_communicate_seconds": 2
    }

async def mock_llama3_analyze_value(text):
    return {
        "score": 85,
        "vague_language_found": ["synergy", "paradigm shift"]
    }

async def mock_llama3_evaluate_competitive(claims):
    return {
        "generic_claims_found": ["We are the best"]
    }

async def mock_llama3_verdict(sentinel_score, stranger_score, oracle_score):
    return "This product will lose 70% of users at signup and collapse technically at 200 concurrent users."
