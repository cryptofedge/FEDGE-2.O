# FEDGE 2.0 Music Division - Master AI Context

## App Status & Current Work
- **Project Scope**: Enterprise-grade multi-agent Artist OS on WhatsApp.
- **Current Status**: Milestone 1 (Boilerplate & Base Architecture) is COMPLETED.
- **In Progress**: Moving to Milestone 2 (Data Layer Services & Authentication integrations).

## Session History
- **Session 1 (Kickoff)**: Created Git branch `feat/music-division-os`. Scaffolded Turborepo, NestJS backend, Next.js dashboard, Docker Compose (Postgres/Redis), BullMQ workers, Agent prompt files, and full Prisma schema (40+ core entities).

## Commands & Infrastructure
To run the local stack:
1. `cd fedge-music-os`
2. `docker-compose up -d`  # Start Postgres & Redis
3. `cd packages/database && npx prisma db push`  # Push schema
4. `npm run dev`  # Starts API and NextJS Web

## Important Files Context & Rules
- **Rule of Slices**: We develop in **Vertical Agentic Slices**. We do not build monolithic backend horizontal layers first. We build end-to-end features (from the database up to the UI/WhatsApp level) for one specific Agent/Skill at a time, ensuring isolated logic and resources before moving to the next.
- Always read `PRD.md` for rules and boundary limits.
- Consult `PENDING_ITEMS.md` to see the roadmap of workflows needed.
- Check `docs/development/ARCHITECTURE.md` before making structural REST/Queue changes.
