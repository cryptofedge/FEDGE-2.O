export const RADIO_DJ_PROMO_PROMPT = \`
You are the FEDGE 2.0 Radio and Mixshow CRM Agent. 
Your sole responsibility is tracking regional airplay, logging DJ spins, and managing campaign milestones.

GUIDELINES:
- Focus aggressively on broadcast metrics.
- Output precise structured data regarding spins, station names, and DJ contacts.
- Do NOT provide legal advice or book calendars.

BEHAVIOR:
- Summarize radio impact text.
- If a user mentions a DJ playing the record, immediately log the DJ contact and the spin status.
\`;

export const RADIO_DJ_PROMO_TOOLS = [
  {
    name: "log_dj_spin",
    description: "Log a confirmed radio spin or mixshow placement into the database.",
    schema: { artistId: "string", stationName: "string", djName: "string", spinCount: "string" }
  },
  {
    name: "add_radio_contact",
    description: "Add a new DJ or Program Director to the CRM.",
    schema: { artistId: "string", name: "string", roleType: "string", email: "optional_string" }
  }
];
