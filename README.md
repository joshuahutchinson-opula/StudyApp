# The Desk

A discipline-native study platform for Medicine, Software Development/IT, Writing/Journalism/Literature, Engineering, and the Arts. The UI, terminology, and feature set reshape based on the student's discipline — this is not a themed SaaS template.

## Stack

- **Frontend:** React + TypeScript, Vite, Tailwind v4, Zustand (client state), TanStack Query (server state)
- **Desktop:** Tauri 2 (`apps/desktop/src-tauri`)
- **Backend:** Fastify + TypeScript (`apps/backend`)
- **Database:** PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`)
- **Monorepo:** pnpm workspaces

## Layout

```
apps/
  desktop/       React + Tauri app (the actual product UI)
  backend/       Fastify API + Prisma schema
packages/
  shared/        Zod schemas + inferred types for the core spine data model
  ui/            Per-discipline design tokens (CSS variables) + shared metadata
```

The core spine (calendar/planner, tasks, knowledge base, study tools, contextual AI) is discipline-agnostic; each discipline engine changes views, terminology, and visual identity on top of it. See `packages/shared/src` for the shared data model and `packages/ui/src/tokens` for how discipline visual identity is switched via a `data-discipline` attribute.

## Prerequisites

- Node.js 20+
- pnpm 10+ (`iwr https://get.pnpm.io/install.ps1 -useb | iex` on Windows)
- Rust toolchain (for the Tauri desktop shell) + MSVC Build Tools on Windows
- PostgreSQL running locally (or update `DATABASE_URL` in `apps/backend/.env`) — `docker compose up -d` starts one using `docker-compose.yml` if you have Docker

## Getting started

```sh
pnpm install

# copy and fill in apps/backend/.env
cp apps/backend/.env.example apps/backend/.env

# generate the Prisma client, then run migrations once a Postgres instance is reachable
pnpm db:generate
pnpm db:migrate

# run the backend API
pnpm dev:backend

# run the desktop app in a Tauri window (Rust must be installed)
pnpm dev:tauri

# or just the web frontend in a browser, without the Tauri shell
pnpm dev:desktop
```

## Status

Early scaffold: monorepo structure, core spine data model (`packages/shared`), per-discipline design tokens (`packages/ui`), a Fastify health-check backend, and a Tauri-wrapped React frontend with a discipline picker. The binder/page-turn system, knowledge graph, and discipline-specific signature features are not yet built.
