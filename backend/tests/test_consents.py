import unittest
import uuid
from starlette.testclient import TestClient
from app.main import app

class ConsentsEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_create_consent_success(self):
        payload = {
            "age_band": "18-24",
            "pseudonym": "PeacefulBanyan",
            "purpose": "ai_mental_wellness_support",
            "version": "1.0",
            "agreed": True,
            "language_preference": "Hinglish",
            "save_chats_consent": False,
        }
        response = self.client.post("/v1/consents", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("consent_id", data)
        self.assertIn("user_id", data)
        self.assertEqual(data["pseudonym"], "PeacefulBanyan")
        self.assertEqual(data["age_band"], "18-24")
        self.assertEqual(data["language_preference"], "Hinglish")
        self.assertEqual(data["save_chats_consent"], False)
        self.assertEqual(data["status"], "active")
        self.assertIn("You can skip questions", data["disclosures_acknowledged"])

    def test_create_consent_auto_pseudonym(self):
        payload = {
            "age_band": "25-34",
            "agreed": True,
            "language_preference": "Hindi",
            "save_chats_consent": True,
        }
        response = self.client.post("/v1/consents", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertTrue(len(data["pseudonym"]) > 0)
        self.assertEqual(data["age_band"], "25-34")
        self.assertEqual(data["language_preference"], "Hindi")
        self.assertEqual(data["save_chats_consent"], True)

    def test_consent_rejected_when_not_agreed(self):
        payload = {
            "age_band": "18-24",
            "agreed": False,
        }
        response = self.client.post("/v1/consents", json=payload)
        self.assertEqual(response.status_code, 422)  # Pydantic validation error

    def test_api_v1_consents_alias_route(self):
        payload = {
            "age_band": "13-17",
            "pseudonym": "CalmSparrow",
            "agreed": True,
        }
        response = self.client.post("/api/v1/consents", json=payload)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["pseudonym"], "CalmSparrow")
        self.assertEqual(data["age_band"], "13-17")

if __name__ == "__main__":
    unittest.main()
