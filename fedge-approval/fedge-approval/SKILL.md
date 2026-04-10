---
name: fedge-approval
description: >
  FEDGE 2.O NYC onboarding flow. Handles new user access control
  with a 3-step approval chain: issue code, pre-approval, admin
  approves or denies. Trigger on every first-contact message from
  a new user and on admin commands approve it or deny it.
tools: Read, Write, Bash
---

## Purpose
Manage the FEDGE 2.O new-user approval flow for all incoming
messages. Two actors: USER and ADMIN identified by ADMIN_ID
in scripts/config.json.

## Session States
Track each user in scripts/sessions.json:
- code_issued: code generated, initial screen sent
- awaiting_input: pre-approval screen sent, waiting for code
- pending_admin: code matched, waiting for admin decision
- approved: admin approved
- denied: admin denied, session cleared

## Flow - New User
1. Generate code: F2O- plus 4 random uppercase alphanumeric chars
2. Save to sessions.json: stage code_issued, code, attempts 0
3. Read templates/initial_code.html, replace F2O-7742 with code
4. Send as Canvas message. No other text.

## Flow - User stage code_issued
Move to awaiting_input. Send templates/preapproval.html with code.

## Flow - User stage awaiting_input
Compare input trimmed uppercased to sessions.json code.
MATCH: set stage pending_admin, add to scripts/pending.json,
tell user code received awaiting admin approval,
ping ADMIN: FEDGE 2.O Approval Request, User, Code, Reply approve it or deny it.
NO MATCH: increment attempts, if 3 or more clear and restart,
else tell user attempts remaining and resend preapproval.

## Admin Commands - ADMIN_ID only
approve it: get oldest pending, send approval.html to user, tell admin approved.
deny it: get oldest pending, clear session, tell user denied, tell admin done.
pending: list all pending entries or say none.

## Rules
- NEVER auto-approve. Always wait for admin.
- NEVER send approval.html unless admin said approve it.
- Replace F2O-7742 in all templates before sending.
- Sessions persist in scripts/sessions.json.
- Only approved users can access financial skills.
