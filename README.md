# Knovate Admin

A standalone admin panel for the SkillofIDE / Knovate platform. It talks to the same
`api-gateway` as the student app, using the existing `/api/admin/*` (user management)
and `/api/recruiter/*` (test authoring — the guard accepts `admin`) REST endpoints.

## Prerequisites
The backend must be running (from `dashbord_backend`):
```bash
cd ../dashbord_backend
docker compose up -d
```

## Run (development)
```bash
npm install
npm run dev          # http://localhost:5174
```
`vite.config.ts` proxies all `/api/*` calls to `VITE_API_TARGET` (default
`http://localhost:8080`, set in `.env.local`). Point it at a remote gateway by editing
`.env.local`.

## Sign in
Use an **admin** account (non-admin logins are rejected at the door), e.g.
`admin@knovate.com`. Reset/create admins from the backend:
```bash
cd ../dashbord_backend
go run add-user.go admin@knovate.com "Admin User" <password> admin
```

## Features
- **Users** — list/search/paginate, add a single user, edit role, grant/revoke course
  enrollment, delete.
- **Bulk import** — upload `.xlsx`/`.csv` (`name, email, phone, password, role, courses`),
  preview with per-row validation, import, and a per-row result report. Download a
  pre-filled template (includes the valid course-id list) from the page.
- **Tests** — create/edit assessments, configure timing/marking/proctoring flags, add
  sections (MCQ / coding / descriptive), attach questions from the bank, publish/unpublish,
  and view + CSV-export results.
- **Question bank** — create/edit/delete MCQ questions used by test sections.

## Course ids
`src/lib/courses.ts` mirrors the backend's `programModules` map
(`1`=Java, `2`=Frontend, `3`=SQL, `4`=Golang, `5`=Fullstack, `genai`, `seo`,
`digital-marketing`, `testing`). Keep the two in sync if the catalog changes.

## Build
```bash
npm run build        # outputs to dist/
```

## Deployment (Docker)
A production image builds the SPA and serves it via nginx, which also proxies
`/api/*` to the gateway.
```bash
docker compose up -d --build     # serves on http://localhost:5174
```
`nginx.conf.template` reads `API_UPSTREAM` (injected at container start). The
compose file defaults it to `http://host.docker.internal:8080` (the gateway
published on the host). To run on the backend's own docker network instead, set
`API_UPSTREAM=http://api-gateway:8080` and attach the service to that network.

## Backend dependency
This app needs one small change already applied to `dashbord_backend`:
`services/api-gateway/graph/resolvers/admin.go` now (a) persists `phone` on
bulk-import, (b) accepts name/email/phone in `PATCH /api/admin/users/{id}`, and
(c) serves `GET /api/admin/courses`. Rebuild the gateway after pulling:
`docker compose up -d --build api-gateway`.

## Notes
- **`xlsx` advisories:** the SheetJS npm package (0.18.5) carries known prototype-
  pollution / ReDoS advisories with no fixed npm release. Files here are uploaded
  by trusted admins, so exposure is low, but for hardening pin to SheetJS's own
  CDN build (https://cdn.sheetjs.com) which ships the patched version.
- **Descriptive sections** draw their prompts from the MCQ bank and are graded
  manually after the attempt (the platform has no separate descriptive authoring).
- **Coding sections** attach problems from the problem-service; seed problems
  (`dashbord_backend/seed-problems.go`) for the picker to show anything.
