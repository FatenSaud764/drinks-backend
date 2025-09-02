# syntax=docker/dockerfile:1

FROM python:3.13-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY barbackend ./barbackend
COPY manage.py ./
COPY tests.py ./

# Default environment for tests; can be overridden
ENV POSTGRES_HOST=postgres \
    POSTGRES_USER=baruser \
    POSTGRES_PASSWORD=barpass \
    POSTGRES_DB=barapp_db \
    POSTGRES_PORT=5432 \
    DJANGO_SETTINGS_MODULE=barbackend.settings

# Run tests by default
CMD ["python", "manage.py", "test", "-v", "2"]
