import unittest
from starlette.testclient import TestClient
from app.main import app

class HealthEndpointTestCase(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_basic_liveness(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_detailed_health(self):
        response = self.client.get("/api/v1/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertEqual(data["service"], "Inearly Backend")
        self.assertIn("privacy_compliance", data)
        self.assertTrue(data["privacy_compliance"]["dpdp_compliant"])
        self.assertEqual(data["privacy_compliance"]["zero_pii_policy"], "enforced")

if __name__ == "__main__":
    unittest.main()
