# OOP-G2T4 Clinicsystem

This repository contains a Spring Boot backend (clinicsystem) and a Next.js front-end (front-end) for a simple clinic queue/appointment system.

Quick start

Backend (Spring Boot):

1. Open a terminal and start the backend:

```powershell
cd "C:\OOP IS442\PROJECT\OOP-G2T4\clinicsystem"
./mvnw.cmd spring-boot:run
```

2. The backend runs on http://localhost:8080 by default.

Frontend (Next.js):

1. In a separate terminal, start the frontend dev server:

```powershell
cd "C:\OOP IS442\PROJECT\OOP-G2T4\front-end"
npm install
npm run dev
```

2. The frontend runs on http://localhost:3000 and proxies `/api/*` requests to the backend during development.

Notes

- Database configuration is in `clinicsystem/src/main/resources/application.yml`. It currently points to a Postgres database (Supabase) by default.
- Migrations are located in `clinicsystem/src/main/resources/db/migration` (Flyway). Be careful when changing applied migrations on a live database.
- If you see issues with API requests from the server (Next SSR), please ensure `NEXT_PUBLIC_API_URL` is set or run the frontend alongside the backend.
