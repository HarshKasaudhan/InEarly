import unittest
from starlette.testclient import TestClient
from app.main import app

class MemoryAndPlansTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_wellness_recommendations(self):
        response = self.client.get("/v1/plans/recommendations?category=academic_stress&limit=2")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)
        self.assertLessEqual(len(data), 2)
        item = data[0]
        self.assertIn("title", item)
        self.assertIn("duration_minutes", item)
        self.assertIn("evidence_rationale", item)
        self.assertIn("instructions", item)

    def test_goal_opt_in_and_skip(self):
        # Opt-in to goal
        payload_optin = {
            "user_id": "test-user-123",
            "goal_id": "box_breathing_pranayama",
            "action": "opted_in",
        }
        res1 = self.client.post("/v1/memories/goals", json=payload_optin)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "opted_in")

        # Skip goal
        payload_skip = {
            "user_id": "test-user-123",
            "goal_id": "box_breathing_pranayama",
            "action": "skipped",
        }
        res2 = self.client.post("/v1/memories/goals", json=payload_skip)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "skipped")

    def test_get_user_memories(self):
        response = self.client.get("/v1/memories?user_id=test-user-123")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("memories", data)
        self.assertIn("privacy_notice", data)
        self.assertIn("total_stored_checkins", data)

    def test_delete_specific_memory(self):
        memory_id = "sample-checkin-01"
        response = self.client.delete(f"/v1/memories/{memory_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["memory_id"], memory_id)
        self.assertIn("permanently erased", data["message"])

    def test_delete_account_data_erasure(self):
        user_id = "user-to-wipe-456"
        response = self.client.delete(f"/v1/account-data?user_id={user_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["user_id"], user_id)
        self.assertIn("Cryptographic Hard Erasure", data["erasure_type"])
        self.assertIn("completely wiped", data["message"])

    def test_account_erasure_requires_user_id(self):
        response = self.client.delete("/v1/account-data?user_id=")
        self.assertEqual(response.status_code, 400)

if __name__ == "__main__":
    unittest.main()
