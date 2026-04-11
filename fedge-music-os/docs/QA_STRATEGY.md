# Quality Assurance Strategy

## Team Structure
- **Rafael Fellito Rodriguez Jr.**: System Operator & Ultimate Decider.
- **AI Agent (Codex/FEDGE Developer)**: Architect, code generator, test writer.

## Quality Gates
1. **TypeScript Strictness**: Code must pass `tsc --noEmit`. No implicitly `any` types on database models or API routes.
2. **Linting**: Code formatted strictly via `Prettier`.
3. **Database Guardrails**: Migrations must not drop production columns without explicit user agreement. PRISMA client must be successfully generated.
4. **Agent Guardrails**: Escaped prompts must never grant command injection tools (`Bash`). Tools map explicitly to JS functions.

## Testing Pyramid (Goals)
- **Unit (70%)**: Business logic of domain services (e.g., attempt counters, calendar formatting).
- **Integration (20%)**: `Prisma` database transactions and `BullMQ` enqueueing.
- **E2E (10%)**: Webhook payload validation from WhatsApp -> BullMQ -> AI response.

## Security & Compliance Checklist
- [x] Absolute pathing removed (Cross-platform compatible).
- [ ] Environment Variables loaded securely (no hardcoded keys in repo).
- [ ] Webhook payloads cryptographically verified (`x-hub-signature-256`).
- [ ] PII data contained strictly to `postgresql` (not logged out to terminal stdout).
