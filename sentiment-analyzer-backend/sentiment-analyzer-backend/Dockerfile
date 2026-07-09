# Use Python 3.11 to match the Nix flake (pyPkgs = python311)
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy requirements.txt into the container
COPY requirements.txt /app/

# Install dependencies
# Install PyTorch-specific packages first
RUN pip install --upgrade pip \
    && pip install torch==2.5.1+cpu torchvision==0.20.1+cpu torchaudio==2.5.1+cpu --index-url https://download.pytorch.org/whl/cpu \
    && pip install -r requirements.txt

# Copy the entire backend code into the container
COPY . /app/

RUN chmod +x /app/entrypoint.sh

# Expose the port the app runs on
EXPOSE 8000

# Runs migrations then serves via gunicorn (runserver is dev-only and was
# never meant to hold a real deployment — see README Notes for Future Work)
CMD ["/app/entrypoint.sh"]
