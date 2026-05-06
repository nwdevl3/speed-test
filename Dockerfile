# --- Build Stage ---
FROM node:20-slim AS build-stage
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Runtime Stage ---
FROM python:3.9-slim
WORKDIR /app

# Install system dependencies for speedtest-cli and networking
RUN apt-get update && apt-get install -y \
    curl \
    iputils-ping \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY app.py .

# Copy built frontend from build-stage
COPY --from=build-stage /app/frontend/dist ./frontend/dist

# Expose port (Railway will provide this via environment variable)
EXPOSE 8080

# Run with Gunicorn, using the PORT env var provided by the platform
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} app:app"]
