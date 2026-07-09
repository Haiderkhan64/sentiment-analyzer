# sentiment_api/urls.py
from django.urls import path
from .views import analyze_sentiment

urlpatterns = [
    path('analyze/', analyze_sentiment, name='analyze_sentiment'),
]

