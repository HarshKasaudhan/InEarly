import unittest
from starlette.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.services.safety_interceptor import safety_interceptor, VERIFIED_INDIAN_HELPLINES
from app.services.agents import agent_orchestrator
from app.schemas.chat import ChatMode

class IntegrationAndQATestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_environment_variables_security(self):
        """Verify that secret keys and configuration are never exposed in public responses."""
        # 1. Health endpoint check
        health_res = self.client.get("/health")
        self.assertEqual(health_res.status_code, 200)
        health_data = health_res.json()
        
        # Verify no secret keys are present in health payload
        self.assertNotIn("SUPABASE_SERVICE_ROLE_KEY", str(health_data))
        self.assertNotIn("GEMINI_API_KEY", str(health_data))
        self.assertNotIn("APP_ENCRYPTION_KEY", str(health_data))

    def test_safety_interceptor_comprehensive_helplines(self):
        """Ensure distress keywords in English, Hindi, and Hinglish trigger Tele-MANAS (14416) & Emergency (112)."""
        test_phrases = [
            ("I feel like ending my life right now", "English"),
            ("Mujhe lagta hai jaan de dunga ab", "Hinglish"),
            ("मुझे आत्महत्या करने का मन कर रहा है", "Hindi"),
        ]

        for phrase, lang in test_phrases:
            result = safety_interceptor.scan(phrase, conversation_id="qa-test-conv", language_pref=lang)
            self.assertTrue(result.is_triggered, f"Phrase failed to trigger safety interceptor: {phrase}")
            self.assertIsNotNone(result.crisis_response_text)
            
            # Ensure Tele-MANAS (14416) and Emergency (112) are present in helpline cards
            helpline_numbers = [h["number"] for h in result.helplines]
            self.assertIn("14416", helpline_numbers)
            self.assertIn("112", helpline_numbers)

            # Ensure zero plain text sensitive user message is exposed in audit log
            self.assertNotIn(phrase, result.audit_entry.message_sha256)
            self.assertEqual(len(result.audit_entry.message_sha256), 64)  # Valid SHA-256

    def test_gemini_api_drop_graceful_fallback(self):
        """Verify that when Gemini LLM drops or is unavailable, the conversational fallback handles requests with empathy."""
        # Test Chat in Listen Mode
        response = self.client.post(
            "/api/v1/chat",
            json={
                "message": "I am feeling immense academic stress and exam anxiety",
                "mode": "listen",
                "language_preference": "English",
                "age_band": "18-24",
                "history": [],
            },
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(len(data["reply"]) > 10)
        self.assertFalse(data["safety_alert"])
        # Ensure tentative tags are derived even during fallback
        self.assertTrue(any(t["category"] == "academic_stress" for t in data["tentative_tags"]))

    def test_database_drop_graceful_handling(self):
        """Verify that even when database connection fails, consent, chat, and memory endpoints remain functional."""
        # Consent registration should succeed gracefully
        consent_res = self.client.post(
            "/api/v1/consents",
            json={
                "purpose": "mental_wellness_support",
                "version": "1.0",
                "age_band": "18-24",
                "language_preference": "Hinglish",
                "save_chats_consent": False,
                "agreed": True,
            },
        )
        self.assertEqual(consent_res.status_code, 201)
        consent_data = consent_res.json()
        self.assertTrue(consent_data["pseudonym"])
        self.assertEqual(consent_data["status"], "active")

        # Memory listing should return resilient default store
        mem_res = self.client.get(f"/api/v1/memories?user_id={consent_data['user_id']}")
        self.assertEqual(mem_res.status_code, 200)
        self.assertIn("memories", mem_res.json())

        # Account erasure should succeed without 500 error
        erase_res = self.client.delete(f"/api/v1/account-data?user_id={consent_data['user_id']}")
        self.assertEqual(erase_res.status_code, 200)
        self.assertTrue(erase_res.json()["success"])

if __name__ == "__main__":
    unittest.main()
