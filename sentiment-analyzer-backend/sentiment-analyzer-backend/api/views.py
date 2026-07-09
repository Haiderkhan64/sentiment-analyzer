import logging
import threading

from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from transformers import pipeline

logger = logging.getLogger(__name__)

MAX_CHARS = 5000

_sentiment_analyzer = None
_load_lock = threading.Lock()


def get_sentiment_analyzer():
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        with _load_lock:
            if _sentiment_analyzer is None:
                _sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model="distilbert-base-uncased-finetuned-sst-2-english",
                )
    return _sentiment_analyzer


@api_view(['POST'])
@throttle_classes([ScopedRateThrottle])
def analyze_sentiment(request):
    # IsAuthenticated is now the DRF default (see settings.REST_FRAMEWORK),
    # so an invalid/missing Clerk token is rejected with 401 before this
    # line ever runs.
    analyze_sentiment.throttle_scope = "analyze"

    text = request.data.get("text")
    if not text or not isinstance(text, str):
        return Response({"error": "No text provided."}, status=400)
    if len(text) > MAX_CHARS:
        return Response({"error": f"Text exceeds {MAX_CHARS} character limit."}, status=400)

    sentiment_analyzer = get_sentiment_analyzer()

    try:
        overall_result = sentiment_analyzer(text, truncation=True, max_length=512)[0]
        overall_sentiment = overall_result["label"]
        overall_confidence = overall_result["score"]

        words = text.split()
        word_results = sentiment_analyzer(words, truncation=True, max_length=512) if words else []
    except Exception:
        logger.exception("Sentiment inference failed for user %s", request.user)
        return Response({"error": "Analysis failed. Please try again."}, status=500)

    def generate_predictions():
        try:
            for word, result in zip(words, word_results):
                yield f"{word} - Sentiment: {result['label']} - Confidence: {result['score']}\n"
            yield f"\n-Overall- Sentiment: {overall_sentiment} - Confidence: {overall_confidence}\n"
        except Exception:
            # A mid-stream failure here would otherwise dump a raw traceback
            # into the response body since headers are already sent.
            logger.exception("Streaming failed mid-response for user %s", request.user)
            yield "\n[error] Analysis interrupted.\n"

    return StreamingHttpResponse(generate_predictions(), content_type="text/plain")