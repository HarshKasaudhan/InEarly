import unittest
from starlette.testclient import TestClient
from app.main import app
from app.services.safety_interceptor import safety_interceptor

class SafetyInterceptorTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_english_crisis_interception_endpoint(self):
        payload = {
            "message": "I am having thoughts of wanting to end my life, please help me",
            "mode": "listen",
            "language_preference": "English",
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["safety_alert"])
        self.assertEqual(data["model_used"], "deterministic-safety-interceptor")
        self.assertIn("14416", str(data["resources"]))  # Tele-MANAS
        self.assertIn("112", str(data["resources"]))    # National Emergency

        # Check structured helpline cards
        helpline_names = [h["name"] for h in data["helpline_details"]]
        self.assertIn("Tele-MANAS (Govt. of India)", helpline_names)
        self.assertIn("National Emergency Number", helpline_names)

    def test_hinglish_crisis_interception_endpoint(self):
        payload = {
            "message": "Mera jaan dene ka mann ho raha hai, sab khatam karna chahta hoon",
            "mode": "listen",
            "language_preference": "Hinglish",
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["safety_alert"])
        self.assertEqual(data["model_used"], "deterministic-safety-interceptor")
        self.assertIn("14416", str(data["resources"]))
        self.assertIn("Tele-MANAS", str(data["resources"]))

    def test_hindi_devanagari_crisis_interception_endpoint(self):
        payload = {
            "message": "मुझसे और बर्दाश्त नहीं हो रहा, मैं आत्महत्या करना चाहता हूँ",
            "mode": "listen",
            "language_preference": "Hindi",
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["safety_alert"])
        self.assertEqual(data["model_used"], "deterministic-safety-interceptor")
        self.assertIn("14416", str(data["resources"]))

    def test_secure_audit_logging_data_minimization(self):
        raw_sensitive_text = "I feel like committing suicide right now"
        result = safety_interceptor.scan(raw_sensitive_text, conversation_id="conv-test-999")
        self.assertTrue(result.is_triggered)
        audit = result.audit_entry
        self.assertIsNotNone(audit)

        # DPDP Audit Log Verification: Raw message text is NEVER stored in the audit entry
        self.assertEqual(len(audit.message_sha256), 64)
        self.assertNotIn(raw_sensitive_text, str(audit.__dict__))
        self.assertNotIn("committing suicide", str(audit.__dict__))
        self.assertEqual(audit.action_taken, "intercepted_and_escalated_to_helplines")
        self.assertEqual(audit.conversation_id, "conv-test-999")

    def test_benign_message_does_not_trigger_interceptor(self):
        result = safety_interceptor.scan("Today was a busy day with assignments and tests.")
        self.assertFalse(result.is_triggered)
        self.assertIsNone(result.audit_entry)

if __name__ == "__main__":
    unittest.main()
