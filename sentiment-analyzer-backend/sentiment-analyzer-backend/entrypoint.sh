#!/bin/sh
set -e

python manage.py migrate --noinput

# --workers 2: keep it low — each worker loads its own copy of the DistilBERT
#   model into memory, so more workers = more RAM, not necessarily more
#   throughput on a CPU-only box.
# --timeout 120: sentiment inference on longer inputs can take a few seconds;
#   gunicorn's default 30s timeout is too aggressive for that.
exec gunicorn sentiment_analyzer_backend.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 120
