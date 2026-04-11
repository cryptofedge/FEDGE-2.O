# FEDGE 2.0 Music Division (Artist OS)

Welcome to the central monorepo for the FEDGE 2.0 Artist OS platform.

## Architecture Stack
- **Frontend**: Next.js App Router
- **Backend API**: NestJS
- **Database**: PostgreSQL (via Prisma)
- **Queues/Workers**: BullMQ on Redis
- **Monorepo**: Turborepo

## Local Setup Instructions

1. **Install Dependencies**
   Run `npm install` from the root of this folder to lock the monorepo workspaces and pull in Turbo.

2. **Start Infrastructure Services**
   Fire up PostgreSQL and Redis using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. **Configure Environment**
   Copy the example environment template:
   ```bash
   cp .env.example .env
   ```
   *Note: Populate any API keys you possess (Claude, WhatsApp API, Clerk) before progressing to agent tests.*

4. **Initialize Database**
   Push the Prisma schema to the Docker PostgreSQL database:
   ```bash
   cd packages/database
   npx prisma db push
   ```

5. **Start Development Apps**
   Run the full turbo pipeline. This single command will run both the Frontend (Next.js) dev server and the Backend (NestJS) API locally.
   ```bash
   npm run dev
   ```
