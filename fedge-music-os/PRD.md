# Product Requirements Document (PRD)

## General Information
- **App Name**: FEDGE 2.0 Music Division (Artist OS)
- **Platform**: WhatsApp (Primary conversational), Web Admin/Dashboard (Secondary)
- **Purpose**: A multi-agent artist operating system functioning as a daily executive assistant (Chief of Staff) to manage calendars, approvals, and route requests to specialized music business agents.

## Hard Constraints
- **Legal Boundaries**: The AI must NEVER present itself as a law firm. Issue-spotting in contracts is business review, not legal advice.
- **Financial Bounds**: No unapproved or autonomous financial transactions.
- **Rights Registration**: Clear separation of PRO (BMI), Mechanical (MLC), and SoundExchange structures. Do not mix them.
- **Account Access**: Strict Gatekeeper onboarding required (`F2O-XXXXXX` tracking code) before any sensitive skill unlocks.

## AI & Framework Rules
- Model interaction is fundamentally **Event-Driven** and **Schedule-First**. The Google Calendar API acts as the true source of time.
- All potentially high-risk actions *must* generate an `ApprovalRequest` entity for a human. No automatic legal clearance.
- **Rule of Slices**: Agents do not bleed context. `artist_chief_of_staff` handles routing, while `rights_registry` only cares about registrations.

## Non-Goals
- NOT a generic Q&A music chatbot.
- NOT a music streaming application.
- NOT a consumer-facing fan community tool.

## Architecture & Development Plan
- Stack: `Next.js` (Web), `NestJS` (API), `PostgreSQL` (Prisma), `BullMQ`, `Turborepo`.
- Phase 1 MVP focuses on Onboarding, Chief of Staff tasks, Rights Registry, Release Ops, and Live Booking.
