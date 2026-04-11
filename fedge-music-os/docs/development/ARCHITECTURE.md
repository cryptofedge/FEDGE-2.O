# FEDGE 2.0 Architecture

## Tech Stack
| Component | Technology | 
|---|---|
| Monorepo | Turborepo |
| Backend Core | NestJS (TypeScript) |
| Frontend Web | Next.js (App Router), TailwindCSS |
| Database | PostgreSQL + Prisma ORM |
| Background Queues | Redis + BullMQ |
| Auth & RBAC | Clerk |

## Database Models (Core)
- **Users**: User, ArtistProfile, TeamMember
- **Scheduling**: Task, CalendarEvent, TaskDependency
- **Projects**: Project, Campaign, Release, RightsChecklist
- **CRM/Booking**: Contact, BookingOpportunity, TravelPlan
- **Legal/Audit**: ContractRecord, ApprovalRequest, RiskFlag, AuditLog

## Service Layout Layer
- `MessageRouterProcessor`: Intercepts raw Webhooks, maps to specific agent cues.
- `ChiefOfStaffService`: Top layer orchestrator. Reads Google Calendar, queries DB tasks, builds daily briefings.
- `RightsRegistryService`: Executes the checklist updates triggered by AI.

## External API Endpoints
- `POST /webhooks/whatsapp`: Listen for incoming messages from users.
- `POST /api/v1/admin/approvals/:id/decide`: Interfacing explicitly with human escalation queue.
- `POST /api/v1/calendar/sync`: Webhook receiver for Google Calendar push notifications.
