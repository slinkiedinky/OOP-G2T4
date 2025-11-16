# Clinicsystem — Clinics & Appointments (OOP-G2T4)

## Quick summary / Core features

- User authentication (JWT)
- Appointment booking and management
- Clinic queue and live queue display
- Patient & staff calendar views
- Notifications and email integration
- Database migrations (Flyway)

## Users & Roles

- Staff: manage appointment bookings and history, and queues
- Patient: view appointment bookings and history, view queue status
- Admin: configure clinics and appointment slots, and manage users

## Tech Stack

### Frontend

- Next.js (App Router)
- React + Material UI
- Axios
- JWT handling

### Backend

- Spring Boot
- Spring Security (JWT Filters)
- Spring Data JPA
- Flyway migrations
- Java Mail Sender

### Database

- PostgreSQL
- Flyway for schema versioning

### Infrastructure

- SMTP

## Environment & Versions

This project was developed and tested with the following runtime and library versions. Where a version is not pinned in the project files it is managed by Spring Boot's dependency management or by the package manager.

- Java: 21 (see `clinicsystem/pom.xml` - `<java.version>21</java.version>`)
- Spring Boot: 3.5.6 (parent in `clinicsystem/pom.xml`)
- Lombok: 1.18.36
- JJWT (JWT library): 0.11.5
- Flyway: managed by Spring Boot (version not explicitly pinned in `pom.xml`)
- Spring Boot Mail (JavaMail / `spring-boot-starter-mail`): managed by Spring Boot
- PostgreSQL JDBC driver: managed by Spring Boot (dependency declared in `pom.xml`)

Frontend packages (from `front-end/package.json`):

- Next.js: 13.5.11
- React: 18.2.0
- @mui/material: 7.3.4
- @mui/icons-material: 7.3.4
- @mui/x-date-pickers: 8.14.1
- @fullcalendar/*: 6.1.19

## Quick Start

### For Windows (cmd.exe)

**Backend**
```bat
cd "…\clinicsystem"
run-dev.bat
```

Alternative (direct mvnw):
```bat
cd clinicsystem
clinicsystem\mvnw.cmd -Dspring-boot.run.profiles=local spring-boot:run
```

**Frontend — Next.js**
```bat
cd "...\front-end"
npm install
npm run dev
```
> Frontend dev server is typically at http://localhost:3000.

### For macOS

**Backend**
```sh
cd "…/clinicsystem"
./run-dev.sh
```

**Frontend — Next.js**
```sh
cd ".../front-end"
npm install
npm run dev
```
> Frontend dev server is typically at http://localhost:3000.

## Project Structure

```
OOP-G2T4/
├─ .git/                        # Git version control metadata
├─ .gitignore                   # Files and directories to be ignored by Git
├─ README.md                    # Project overview, setup, and usage instructions
├─ package-lock.json            # Exact versions of npm dependencies

├─ clinicsystem/                # Java Spring Boot backend application
│  ├─ mvnw / mvnw.cmd           # Maven wrapper for building and running the project
│  ├─ pom.xml                   # Project Object Model: Maven build configuration and dependencies
│  ├─ run-dev.bat / .ps1 / .sh  # Scripts to run the backend in development mode
│  ├─ src/
│  │  ├─ main/
│  │  │  ├─ java/aqms/          # Main application source code
│  │  │  │  ├─ config/         # Spring configuration files
│  │  │  │  ├─ domain/         # JPA entities and business objects
│  │  │  │  ├─ repository/     # Spring Data JPA repositories
│  │  │  │  ├─ service/        # Business logic and services
│  │  │  │  └─ web/            # REST controllers for the API
│  │  │  └─ resources/
│  │  │     ├─ application.yml # Base Spring Boot configuration
│  │  │     ├─ db/migration/   # Flyway database migration scripts
│  │  │     └─ static/         # Static assets (if any) served by the backend
│  │  └─ test/                   # Test source code
│  └─ target/                   # Compiled code and build artifacts (e.g., JAR file)

├─ front-end/                   # Next.js frontend application
│  ├─ package.json              # npm dependencies and scripts for the frontend
│  ├─ next.config.js            # Next.js configuration
│  ├─ public/                   # Static assets (images, fonts)
│  └─ src/
│     ├─ app/                   # Next.js App Router pages and layouts
│     │  ├─ admin/              # Admin-specific pages
│     │  ├─ appointments/       # Appointment booking pages
│     │  ├─ auth/               # Login, signup pages
│     │  ├─ clinics/            # Clinic listing and details pages
│     │  ├─ components/         # UI components specific to pages
│     │  ├─ forgot-password/    # Forgot password flow
│     │  ├─ my-appointments/    # User's own appointments view
│     │  ├─ patient/            # Patient-specific views (e.g., calendar)
│     │  ├─ providers/          # React context providers (Auth, MUI)
│     │  ├─ queue-display/      # Public queue display for a clinic
│     │  ├─ reset-password/     # Reset password flow
│     │  └─ staff/              # Staff-specific pages (e.g., queue management)
│     ├─ components/            # Reusable React components shared across the app
│     └─ lib/                   # Library code, API helpers (e.g., `api.js`)

```

