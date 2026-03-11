# ---- Stage 1: Build React frontend ----
FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: Python runtime ----
FROM python:3.12-slim

# System deps for OpenCV, snap7, etc.
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Backend source
COPY backend/ ./backend/

# Copy built frontend into backend static
COPY --from=frontend-build /app/backend/static/react/ ./backend/static/react/

# Create data directory at the project root
RUN mkdir -p /app/data/captures

WORKDIR /app/backend
RUN mkdir -p static

EXPOSE 8000

# Env defaults (override via docker-compose or -e flags)
ENV VSAFE_API_KEY=""
ENV VSAFE_PORT=8000

CMD ["python", "main.py"]
