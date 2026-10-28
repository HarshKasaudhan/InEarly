import unittest
from starlette.testclient import TestClient
from app.main import app

class ChatEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_chat_listen_mode_with_academic_stress(self):
        payload = {
            "message": "I am so overwhelmed by upcoming exams and syllabus, I can't breathe properly.",
            "mode": "listen",
            "language_preference": "Hinglish",
            "age_band": "18-24",
            "history": [],
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("reply", data)
        self.assertEqual(data["mode"], "listen")
        self.assertIn("tentative_tags", data)
        self.assertTrue(len(data["tentative_tags"]) > 0)
        # Check tentative tag properties
        tag = data["tentative_tags"][0]
        self.assertIn("category", tag)
        self.assertTrue(tag["tentative_flag"])
        self.assertFalse(tag["user_confirmed"])
        self.assertFalse(data["safety_alert"])

    def test_chat_plan_mode(self):
        payload = {
            "message": "Office burnout ho gaya hai, samajh nahi aa raha kaise shuru karun.",
            "mode": "plan",
            "language_preference": "Hinglish",
            "age_band": "25-34",
            "history": [],
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["mode"], "plan")
        self.assertIn("reply", data)
        # Check concern classifier identified burnout/overwhelm
        categories = [t["category"] for t in data["tentative_tags"]]
        self.assertTrue(any(c in ["workplace_burnout", "general_overwhelm"] for c in categories))

    def test_chat_safety_crisis_detection(self):
        payload = {
            "message": "I feel like ending my life right now, nothing is worth it.",
            "mode": "listen",
            "language_preference": "English",
            "history": [],
        }
        response = self.client.post("/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["safety_alert"])
        self.assertTrue(len(data["resources"]) > 0)
        self.assertTrue(any("14416" in r for r in data["resources"]))  # Tele-MANAS helpline

    def test_chat_api_v1_alias(self):
        payload = {
            "message": "Neend nahi aa rahi hai raat ko, overthinking chal rahi hai.",
            "mode": "listen",
            "language_preference": "Hindi",
            "age_band": "18-24",
        }
        response = self.client.post("/api/v1/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        categories = [t["category"] for t in data["tentative_tags"]]
        self.assertIn("sleep_concern", categories)

if __name__ == "__main__":
    unittest.main()
