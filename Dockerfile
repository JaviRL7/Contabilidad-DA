# Usar imagen oficial Python
FROM python:3.12-slim

# Instalar Node.js para compilar frontend
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Instalar dependencias Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar y compilar frontend
COPY frontend/ frontend/
RUN cd frontend && npm install && npm run build-production

# Copiar backend
COPY backend/ backend/

# El puerto que usará Railway
EXPOSE $PORT

# Comando de inicio
CMD python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT