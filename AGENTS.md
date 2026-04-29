# AGENTS.md

## Project Overview

This project is a fullstack Laboratory Reservation and Utilization System for Pamantasan ng Cabuyao (PNC).

The system allows:
- Students and faculty to reserve laboratory rooms
- Availability checking before booking
- Conflict-free scheduling
- Admin approval workflow
- Utilization analytics

---

## Tech Stack (MANDATORY)

Agents MUST use:

- Frontend: Next.js (App Router) + TypeScript
- Backend: Next.js API Routes
- Database: SQLite
- ORM: Prisma
- Styling: Tailwind CSS
- UI: ShadCN UI

DO NOT use:
- Express, NestJS, or external backends
- MongoDB or PostgreSQL

---

## Project Structure (STRICT)

/app
  /login
  /dashboard
  /reserve
  /my-reservations
  /admin
  /admin/reports
  /api

/components
  /ui
  /forms
  /tables

/lib
  db.ts
  auth.ts
  utils.ts

/prisma
  schema.prisma

---

## Time & Date Standards (CRITICAL)

Agents MUST follow this format:

- date: string (ISO format: YYYY-MM-DD)
- startTime: string (24-hour format: HH:mm)
- endTime: string (24-hour format: HH:mm)

Example:
- date: "2026-04-29"
- startTime: "13:00"
- endTime: "15:00"

All comparisons must be done using consistent time parsing.

---

## Business Rules (STRICT)

Operating hours:
- Allowed: 07:00 to 22:00 only

Reject if:
- startTime < "07:00"
- endTime > "22:00"
- startTime >= endTime

Conflict condition:
(new.start < existing.end) AND (new.end > existing.start)

Apply only when:
- Same laboratory
- Same date

If conflict:
- Reject reservation

---

## Laboratory Seed Data

Agents must seed:

- Ergonomics Laboratory
- Digital/Embedded Laboratory
- Network Laboratory
- Microbiology/Parasitology Lab
- WSM Laboratory
- Electronics Laboratory
- ComLab1
- ComLab2
- ComLab3
- ComLab4
- ComLab5

---

## Database Schema (Prisma Rules)

User:
- id
- name
- email @unique
- password (hashed using bcrypt)
- role (USER | ADMIN)

Laboratory:
- id
- name

Reservation:
- id
- userId
- labId
- date (YYYY-MM-DD)
- startTime (HH:mm)
- endTime (HH:mm)
- purpose
- status (PENDING | APPROVED | REJECTED)
- createdAt

---

## Authentication (REQUIRED)

Agents MUST implement:

- Password hashing using bcrypt
- Session strategy: JWT-based authentication
- Store token in HTTP-only cookies
- Protect admin routes

DO NOT store plain text passwords.

---

## API Routes (Next.js App Router)

Agents MUST use this format:

POST   /api/reservations
GET    /api/reservations
GET    /api/availability
PATCH  /api/reservations/[id]

---

## Availability Behavior (IMPORTANT)

"Real-time" means:

- Client-side check BEFORE submission
- Use API call (/api/availability)
- No WebSockets required
- No Socket.io

Optional:
- Polling every 5–10 seconds if needed

---

## Core Features

Agents must implement:

1. Authentication system
2. Reservation system
3. Availability checking
4. Conflict detection
5. Admin approval workflow
6. Analytics dashboard

---

## Coding Rules

- Use TypeScript strictly (no `any`)
- Use functional React components only
- Keep components modular
- Separate UI, logic, and DB access
- Do NOT create large monolithic files

---

## Validation Rules

Agents MUST validate:

- Required fields
- Time range (07:00–22:00)
- startTime < endTime
- Conflict detection BEFORE saving
- Availability BEFORE submission

---

## Development Order (STRICT)

1. Create Prisma schema
2. Setup SQLite database
3. Seed laboratory data
4. Implement authentication
5. Build reservation API
6. Add conflict detection logic
7. Build availability API
8. Build frontend pages
9. Connect frontend to API
10. Implement admin dashboard
11. Add analytics

---

## Testing Requirements

Agents must verify:

- No overlapping reservations
- Invalid times are rejected
- API returns correct status codes
- Authentication works correctly

---

## Agent Behavior Rules

- Follow all rules strictly
- Do not assume missing details
- Do not change stack
- Do not skip validation
- Always produce clean, production-ready code