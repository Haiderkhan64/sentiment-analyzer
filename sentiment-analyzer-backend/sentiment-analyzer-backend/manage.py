#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

def main():
    """Run administrative tasks."""
    # Base directory of your Django project
    base_dir = Path(__file__).resolve().parent
    
    # Try loading .env.local first, fallback to .env if it doesn't exist
    env_local = base_dir / ".env"
    env_standard = base_dir / ".env"
    
    try:
        from dotenv import load_dotenv
        if env_local.exists():
            load_dotenv(dotenv_path=env_local)
        elif env_standard.exists():
            load_dotenv(dotenv_path=env_standard)
    except ImportError:
        # If python-dotenv isn't installed yet, Django will still try to run
        # but will fail on missing env vars.
        pass

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sentiment_analyzer_backend.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()