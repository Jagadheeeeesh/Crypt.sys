import random
import re

class ThreatIntelService:
    def __init__(self):
        # In a real scenario, load models here:
        # self.ai_detector = pipeline("text-classification", model="roberta-base-openai-detector")
        pass

    async def detect_ai_generated(self, text: str) -> float:
        # Advanced Transformer Pattern Analysis (Simulated)
        # Mimics BERT/RoBERTa classification features
        
        text_lower = text.lower()
        score = 0.0
        
        # 1. Transformer Artifacts (Common generative patterns)
        # LLMs often use specific transitional phrases and neutral tones
        artifacts = [
            "as an ai", "cannot generate", "regenerate", "model", "context",
            "in summary", "furthermore", "it is important to note", 
            "based on the information", "certainly!", "here is the"
        ]
        artifact_hits = sum(1 for phrase in artifacts if phrase in text_lower)
        if artifact_hits > 0:
            return min(85.0 + (artifact_hits * 10), 99.9)

        # 2. Perplexity / Entropy Proxy
        # AI text often has "perfect" grammar and median sentence length
        words = text.split()
        if len(words) > 10:
            # Vocabulary Richness (Type-Token Ratio)
            unique_words = len(set(words))
            ttr = unique_words / len(words)
            
            # Low TTR (< 0.5) implies repetition typical of some bot output
            # High TTR (> 0.9) in long text implies forced randomness
            if ttr < 0.5:
                score += 15
            
            # Sentence Structure Analysis
            sentences = re.split(r'[.!?]+', text)
            sentences = [s for s in sentences if s.strip()]
            if sentences:
                avg_len = sum(len(s.split()) for s in sentences) / len(sentences)
                # AI tends to average 15-20 words per sentence in formal modes
                if 12 <= avg_len <= 25:
                    score += 10
                    
                # Standard Deviation of sentence length (AI is often more uniform)
                variance = sum((len(s.split()) - avg_len) ** 2 for s in sentences) / len(sentences)
                if variance < 20: # Very uniform sentence lengths
                    score += 15

        # 3. Burstiness Analysis (Human text is bursty, AI is smooth)
        # We detect "smoothness" by checking punctuation distribution
        if len(text) > 50:
            punctuation_count = len(re.findall(r'[.,;!?]', text))
            ratio = punctuation_count / len(words)
            if 0.05 < ratio < 0.08: # "Perfect" punctuation ratio
                score += 10

        # Base probability from "BERT" model simulation
        base_confidence = random.uniform(10.0, 30.0) 
        final_score = base_confidence + score
        
        return min(max(final_score, 0.0), 98.5)

    async def detect_opsec_risk(self, text: str) -> str:
        text_lower = text.lower()
        
        # 1. Critical Geo-spatial Data (Regex)
        # Matches: 34.05N, 118.24W or similar
        coord_pattern = re.compile(r'\d{1,3}\.\d+[NS],\s*\d{1,3}\.\d+[EW]')
        if coord_pattern.search(text):
            return "HIGH"

        # 2. Military Time / Specific Dates
        # Matches: 1400 hours, 14:00Z
        time_pattern = re.compile(r'\d{4}\s*hours|\d{2}:\d{2}Z')
        if time_pattern.search(text):
            return "SENSITIVE"

        # 3. Keyword Analysis
        critical = ["bomb", "attack", "kill", "assassinate", "terrorism", "explosive", "weapon", "hostage", "nuclear"]
        sensitive = ["deployment", "location", "alpha", "bravo", "classified", "operation", "extract", "rendezvous"]
        
        if any(w in text_lower for w in critical):
            return "HIGH"
            
        count = sum(1 for w in sensitive if w in text_lower)
        if count >= 2:
            return "SENSITIVE"
            
        return "SAFE"

    async def detect_phishing(self, text: str) -> str:
        text_lower = text.lower()
        
        # 1. Suspicious Actions
        actions = ["click here", "login", "password", "verify account", "urgent action", "update payment"]
        if any(s in text_lower for s in actions):
            return "HIGH"
            
        # 2. Suspicious Domains (Regex primitive)
        # Matches http://bit.ly/... or raw IP
        suspicious_urls = re.compile(r'http[s]?://(?:\d{1,3}\.|bit\.ly|tinyurl)')
        if suspicious_urls.search(text):
            return "HIGH"
            
        # 3. PII Request
        pii_request = ["ssn", "social security", "credit card", "bank account"]
        if any(p in text_lower for p in pii_request):
            return "MODERATE"
            
        return "LOW"

    async def scan_message(self, text: str) -> dict:
        ai_score = await self.detect_ai_generated(text)
        opsec_risk = await self.detect_opsec_risk(text)
        phishing_risk = await self.detect_phishing(text)
        
        explanation = []
        if ai_score > 70:
            explanation.append("High probability of AI generation detected.")
        if opsec_risk != "SAFE":
            explanation.append(f"OPSEC Risk detected: {opsec_risk}")
        if phishing_risk != "LOW":
            explanation.append(f"Phishing Risk detected: {phishing_risk}")
            
        if not explanation:
            explanation.append("Message appears safe.")

        return {
            "ai_score": round(ai_score, 2),
            "opsec_risk": opsec_risk,
            "phishing_risk": phishing_risk,
            "explanation": " | ".join(explanation)
        }

threat_intel_service = ThreatIntelService()

async def scan_message(text: str) -> dict:
    return await threat_intel_service.scan_message(text)
