# Fiche Standard de Revue des Directions (MEF)

A full-stack web application for managing standardized direction review forms, secured with Keycloak authentication.

## Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, Vite, Tailwind CSS        |
| Backend   | Node.js, Express 5, Mongoose        |
| Database  | MongoDB 7                           |
| Auth      | Keycloak 24                         |
| Container | Docker Compose                      |

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose

## Getting Started

1. Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env
   ```

2. Start all services:

   ```bash
   docker compose up --build
   ```

3. Access the app:
   - Frontend: http://localhost
   - Backend API: http://localhost:5000/api
   - Keycloak admin: http://localhost:8080 (default credentials: `admin` / `admin`)

## Environment Variables

| Variable       | Default   | Description                    |
|----------------|-----------|--------------------------------|
| `MONGO_USER`   | `admin`   | MongoDB root username          |
| `MONGO_PASS`   | `secret`  | MongoDB root password          |
| `KC_ADMIN`     | `admin`   | Keycloak admin username        |
| `KC_ADMIN_PASS`| `admin`   | Keycloak admin password        |

## Project Structure

```
.
├── backend/          # Express API (routes, models, middleware)
├── mef-form/         # React frontend
├── keycloak/         # Keycloak realm config (realm-mef.json)
└── docker-compose.yml
```

## Development (without Docker)

**Backend**
```bash
cd backend
npm install
npm run dev      # starts on port 5000 with nodemon
```

**Frontend**
```bash
cd mef-form
npm install
npm run dev      # starts Vite dev server
```

> Requires a running MongoDB instance and Keycloak. Update `.env` accordingly.
