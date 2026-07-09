from unittest.mock import patch

from rest_framework.test import APITestCase


class AnalyzeSentimentTests(APITestCase):
    url = "/api/analyze/"

    def setUp(self):
        # Bypass real Clerk JWT verification in tests — assert this test
        # user is authenticated without hitting the JWKS endpoint.
        patcher = patch(
            "api.authentication.ClerkJWTAuthentication.authenticate",
            return_value=("test-user-id", "fake-token"),
        )
        self.addCleanup(patcher.stop)
        patcher.start()

    def test_missing_text_returns_400(self):
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", response.json())

    def test_text_over_limit_returns_400(self):
        response = self.client.post(self.url, {"text": "a" * 5001}, format="json")
        self.assertEqual(response.status_code, 400)

    @patch("api.views.get_sentiment_analyzer")
    def test_valid_text_streams_word_and_overall_results(self, mock_get_analyzer):
        def fake_pipeline(inputs, truncation=True, max_length=512):
            if isinstance(inputs, str):
                return [{"label": "POSITIVE", "score": 0.987}]
            return [{"label": "POSITIVE", "score": 0.9} for _ in inputs]

        mock_get_analyzer.return_value = fake_pipeline
        response = self.client.post(self.url, {"text": "I love this"}, format="json")

        self.assertEqual(response.status_code, 200)
        body = b"".join(response.streaming_content).decode()
        self.assertIn("I - Sentiment: POSITIVE", body)
        self.assertIn("-Overall- Sentiment: POSITIVE", body)