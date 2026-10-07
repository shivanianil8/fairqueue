# FAIRQUEUE Production Deployment Guide
> **Enterprise Setup, Production Build, Dockerization, and Operations**

---

## 1. Prerequisites & System Requirements

- **Node.js**: v18.0.0 or higher (v20 LTS recommended)
- **Package Manager**: npm v9+ or yarn
- **Prolog Engine** *(Optional but recommended)*:
  - **SWI-Prolog CLI (`swipl`)**: Available via `brew install swi-prolog` (macOS), `apt-get install swi-prolog` (Debian/Ubuntu), or binary installer for Windows.
  - *Note*: If SWI-Prolog is not installed, FAIRQUEUE automatically engages its embedded **ISO Tau-Prolog engine** with zero configuration required.
- **Database** *(Optional)*:
  - MongoDB v6+ (or MongoDB Atlas connection string).
  - *Note*: If MongoDB is offline, FAIRQUEUE automatically activates its high-performance in-memory fallback store.

---

## 2. Quick-Start (Single Command)

From the root project directory:

```bash
# 1. Install root dependencies
npm install

# 2. Build the production React frontend
npm run build

# 3. Start the production backend server
npm start
```

The application will be live at:  
👉 **`http://localhost:5001`**

---

## 3. Production Environment Configuration (`.env`)

Configure the backend environment in `server/.env`:

```env
# Application Server Port
PORT=5001

# Cryptographic Secret for HMAC-SHA256 JWT Token Generation
JWT_SECRET=fairqueue-production-secret-key-2026-secure-enterprise

# MongoDB Database URI (Optional - defaults to in-memory store if unreachable)
MONGO_URI=mongodb://127.0.0.1:27017/fairqueue

# Custom SWI-Prolog Binary Path (Optional - defaults to standard PATH resolution)
# SWIPL_PATH=/usr/local/bin/swipl
```

---

## 4. Production Process Management (PM2)

For production deployments on Ubuntu or Debian Linux servers:

```bash
# Install PM2 process manager
npm install -g pm2

# Build the client bundle
cd client && npm run build && cd ..

# Launch backend cluster under PM2
pm2 start server/server.js --name "fairqueue-enterprise" -i max

# Save configuration for automatic system reboot recovery
pm2 save
pm2 startup
```

---

## 5. Docker Deployment

### `Dockerfile`
Create a multi-stage production Docker container:

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS build-client
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Runtime Server
FROM node:20-alpine
WORKDIR /app

# Install SWI-Prolog on Alpine Linux
RUN apk add --no-cache swi-prolog

COPY server/package*.json ./server/
RUN cd server && npm ci --production

COPY logic/ ./logic/
COPY server/ ./server/
COPY --from=build-client /app/client/dist ./client/dist

WORKDIR /app/server
EXPOSE 5001

ENV NODE_ENV=production
CMD ["node", "server.js"]
```

### Docker Run:
```bash
docker build -t fairqueue:latest .
docker run -d -p 5001:5001 --name fairqueue-service fairqueue:latest
```

---

## 6. Health-Check & Telemetry Verification

Verify system readiness by querying the telemetry status endpoint:

```bash
curl -s http://localhost:5001/api/status | jq .
```

### Expected Output:
```json
{
  "status": "online",
  "project": "FAIRQUEUE",
  "version": "2.0.0-enterprise",
  "prologEngine": {
    "swiplAvailable": true,
    "activeEngine": "SWI-Prolog (Native CLI)",
    "embeddedEngineAvailable": true
  },
  "database": {
    "type": "In-Memory Store (Resilient Fallback)",
    "status": "ready"
  },
  "queueSummary": {
    "totalVisitors": 12,
    "waitingCount": 8,
    "activeQueues": 3
  }
}
```
