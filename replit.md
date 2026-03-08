# V.HUB - Virtual Dubbing Studio Platform

## Overview

V.HUB is a professional virtual dubbing studio management platform (estúdio de dublagem virtual) built for Brazilian Portuguese-speaking users. It allows production companies and studios to manage dubbing productions, recording sessions, voice actors, characters, takes, and studio staff through a web interface.

Key features:
- Multi-studio workspace with role-based access control
- Production and character management with script support (JSON scripts with timecodes)
- Recording room with browser-based audio capture, waveform visualization, and take management (files saved as `[PERSONAGEM]_[DUBLADOR]_[HHMMSS].WAV`)
- Daily.co voice/video chat integration (auto-creates unique room per session via API, 4h expiry, prejoin UI enabled)
- Session scheduling and participant tracking
- Platform-wide god-level admin panel for platform_owner (real-time polling every 5s)
- Studio-level admin panel for studio_admin (approve/reject registrations, manage members)
- Registration flow with studio selection (user picks studio → admin approves with role assignment)
- Notification system
- Glassmorphism dark premium UI with animated mesh gradient background

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with TypeScript, using Vite as the bundler
- **Routing**: Wouter (lightweight client-side routing)
- **State/Data Fetching**: TanStack React Query v5 for server state management; all API calls go through a shared `authFetch` utility that handles 401 redirects to `/api/login`
- **UI Components**: shadcn/ui (New York style) built on Radix UI primitives, styled with Tailwind CSS
- **Design System**: Glassmorphism dark theme — custom CSS variables in `index.css`; animated mesh gradient background (3 radial gradients, 25s animation); custom `.vhub-*` component classes with `backdrop-filter: blur()`, translucent borders, and glass shadows
- **Theme**: Dark by default (no light mode). Background: `hsl(222 47% 6%)`. Accent: blue (`hsl(220 100% 55%)`) + violet (`hsl(270 80% 60%)`). Glass panels: `rgba(255,255,255,0.06)` with blur.
- **Logo**: SVG at `public/logo.svg` — gradient microphone + sound waves icon
- **Forms**: React Hook Form with Zod resolvers
- **Internationalization**: Portuguese (pt-BR) strings in `client/src/lib/i18n.ts`
- **Code splitting**: All pages use `React.lazy` + `Suspense` for lazy loading
- **Audio**: Custom audio engine in `client/src/lib/audio/` for microphone management, recording, and waveform visualization (Web Audio API)

### Backend Architecture

- **Runtime**: Node.js with TypeScript (tsx for dev, esbuild for production)
- **Framework**: Express.js
- **Structure**:
  - `server/index.ts` — app bootstrap, middleware, HTTP server
  - `server/routes.ts` — all REST API route definitions
  - `server/storage.ts` — data access layer (Drizzle ORM queries)
  - `server/middleware/auth.ts` — `requireAuth`, `requireAdmin`, `requireStudioAccess`, `requireStudioRole` middleware (session-based)
  - `server/lib/logger.ts` — structured logging utility
  - `server/replit_integrations/auth/` — Passport.js LocalStrategy (email/password) auth setup
- **File uploads**: Multer (memory storage), files saved to `public/uploads/`, served statically at `/uploads`
- **Shared types**: `shared/schema.ts` and `shared/routes.ts` are imported by both client and server for type-safe API contracts

### Authentication & Authorization

- **Auth Provider**: Email + password via Passport.js LocalStrategy (no Replit OIDC)
- **Password hashing**: `crypto.scryptSync` (Node built-in, no bcrypt dependency)
- **Session storage**: PostgreSQL-backed sessions via `connect-pg-simple`, stored in `http_sessions` table
- **Session secret**: `SESSION_SECRET` environment variable
- **Registration flow**: Users register via `/login` page → select studio from dropdown → account created with `status: "pending"` → `studioMembership` created as pending → studio_admin (or platform_owner) approves with role assignment → user gets `status: "approved"` and studio access
- **Platform owner seed**: Auto-created at startup: `borbaggabriel@gmail.com` / `pipoca25`
- **Role system** (hierarchical):
  - `platform_owner` (100) — full platform access, god-level admin panel, always Jitsi moderator
  - `studio_admin` (80) — manage studio members, approve registrations, create/edit productions, manage staff, studio admin panel
  - `diretor` (60) — create sessions (can only delete own sessions), Jitsi moderator
  - `engenheiro_audio` (40) — view-only access to productions/sessions
  - `dublador` (20) — record takes, save/download/delete own takes, join sessions
  - `aluno` (10) — record takes, save/download/delete own takes, join sessions
- **Studio membership**: Users can have multiple roles within a studio via `userStudioRoles` table; membership approval flow via `studioMemberships`
- **Frontend auth flow**: `useAuth` hook fetches `/api/auth/user`; login via POST `/api/auth/login`; register via POST `/api/auth/register`; logout via POST `/api/auth/logout`; unauthenticated users are redirected to `/login`

### Admin Panels

- **Platform Owner Admin** (`/admin`): God-level real-time panel with 5s polling. Manages all users, studios, productions, sessions, takes, audit logs. Can approve/reject any pending registration, force role/status changes, reset passwords, create/delete studios.
- **Studio Admin Panel** (`/studio/:studioId/admin`): Studio-level management. Approve/reject pending registrations for the studio, manage members and roles, create productions and sessions. Visible in sidebar for studio_admin and platform_owner.

### Data Storage

- **Database**: PostgreSQL via Drizzle ORM (dialect: postgresql)
- **Schema location**: `shared/schema.ts` (main) + `shared/models/auth.ts` (auth tables)
- **Key tables**:
  - `http_sessions` — session store (mandatory, do not drop)
  - `users` — user profiles with auth
  - `user_roles` — platform-level roles
  - `studios` — studio profiles with address, contact, and media
  - `studio_memberships` — pending/approved/rejected studio membership requests
  - `user_studio_roles` — per-studio role assignments
  - `productions` — dubbing production records with video URL and JSON script
  - `characters` — characters per production
  - `sessions` — recording sessions with scheduling (table name: `recording_sessions`)
  - `session_participants` — session attendees
  - `takes` — audio take records linked to sessions/characters
  - `staff` — studio staff registry
  - `audit_log` — platform action audit trail
  - `platform_settings` — key/value platform configuration
  - `notifications` — user notification inbox
- **Migrations**: `drizzle-kit push` (`npm run db:push`) for schema deployment

### API Structure

- Type-safe API contract defined in `shared/routes.ts` using Zod schemas
- `buildUrl` utility for parameterized URL construction
- REST endpoints: `/api/studios`, `/api/productions`, `/api/sessions/:sessionId/takes` (POST/GET), `/api/characters`, `/api/staff`, `/api/takes/:id` (DELETE/download), `/api/notifications`, `/api/admin/*`, `/api/auth/*`
- Public endpoints (no auth): `GET /api/auth/studios-public` (for registration form)
- All protected routes use `requireAuth` middleware; role-specific routes layer additional middleware

### Build & Dev

- Dev: `tsx server/index.ts` serves both Express API and Vite middleware (HMR via WebSocket at `/vite-hmr`)
- Production build: `script/build.ts` runs Vite (client → `dist/public`) then esbuild (server → `dist/index.cjs`)
- Path aliases: `@/*` → `client/src/*`, `@shared/*` → `shared/*`, `@assets/*` → `attached_assets/*`

## External Dependencies

### Required Environment Variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Express session signing secret |
| `DAILY_API_KEY` | Daily.co API key for video room creation |

### Third-Party Services

- **PostgreSQL**: Primary data store. Managed via Drizzle ORM with `node-postgres` (pg) driver.
- **Daily.co**: Video/voice chat rooms. Backend creates rooms via `POST https://api.daily.co/v1/rooms` with `DAILY_API_KEY`. Each session gets a unique room with 4h expiry and prejoin UI.
- **Google Fonts**: Inter and JetBrains Mono loaded via CDN

### Key NPM Dependencies

- `drizzle-orm` + `drizzle-kit` — ORM and migration tooling
- `express` + `express-session` — HTTP server and session management
- `connect-pg-simple` — PostgreSQL session store adapter
- `passport` + `passport-local` — email/password authentication
- `@tanstack/react-query` — client-side data fetching and caching
- `wouter` — client-side routing
- `@radix-ui/*` — accessible UI primitives
- `tailwind-merge` + `clsx` — CSS class utilities
- `zod` + `drizzle-zod` — runtime validation and schema inference
- `multer` — multipart file upload handling
- `date-fns` — date formatting
