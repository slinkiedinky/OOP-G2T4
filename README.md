# Clinicsystem — Clinics & Appointments (OOP-G2T4)

## Project structure

Top-level (root)

clinicsystem/ (backend)

```
clinicsystem/
  mvnw
  mvnw.cmd
  pom.xml
  run-dev.bat        # loads .env and runs the module with local profile
  run-dev.ps1
  .env.sample        # env template (safe to commit)
  src/
    main/
      java/          # app packages (aqms/...)
      resources/
        application.yml
        application-dev.yml
        application-prod.yml
        db/migration/  # Flyway migrations (V*.sql)
        static/
    test/
  target/
```

front-end/ (frontend)

```
front-end/
  package.json
  next.config.js
  src/
    app/              # app-router pages
      staff/queue/
      appointments/
      auth/
    components/        # shared React components
    lib/               # client API helper (api.js)
  node_modules/
  .next/
```

## Quick summary / Core features

- User authentication (JWT)
- Appointment booking and management
- Clinic queue and live queue display
- Provider & staff calendar views
- Notifications and email integration
- Database migrations (Flyway)

## Users & Roles

- Staff: manage appointment bookings and history, and queues
- Patient: view appointment bookings and history
- Admin: configure clinics and appointment slots, and manage users

## Quick start (Windows - cmd.exe)

1) Backend

```bat
cd "C:\OOP IS442\PROJECT\OOP-G2T4\clinicsystem"
run-dev.bat
```
Alternative (direct mvnw):

```bat
cd clinicsystem
clinicsystem\mvnw.cmd -Dspring-boot.run.profiles=local spring-boot:run
```


2) Frontend — Next.js

```bat
cd "C:\OOP IS442\PROJECT\OOP-G2T4\front-end"
npm install
npm run dev
```

Frontend dev server is typically at http://localhost:3000.