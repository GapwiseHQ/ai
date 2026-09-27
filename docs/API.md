# Gapwise AI API

## Browser delegation API

These HTTPS endpoints are called by the Gapwise web app, not directly by models.

- `PUT /api/delegation/snapshot` — publish/replace the minimized AI snapshot for the authenticated user.
- `GET /api/delegation/actions` — fetch decrypted queued AI actions for the authenticated user.
- `POST /api/delegation/actions/:id/complete` — mark an action applied or rejected by Gapwise.
- `DELETE /api/delegation` — revoke delegation and delete the user's AI snapshot/actions.
- `GET /api/delegation` — read delegation status/permissions without returning schedule content.

All browser endpoints require a Supabase bearer token and enforce the configured `GAPWISE_APP_ORIGIN` CORS policy. They never use ambient cookies.

## Remote MCP API

The provider-neutral Streamable HTTP MCP endpoint is `POST /api/mcp` (with protocol-compatible `GET` handling). The same endpoint exposes a stateless public campus-intelligence surface across supported universities and an OAuth-protected private student-context surface.

The complete current tool catalog is maintained in [TOOL_CONTRACT.md](TOOL_CONTRACT.md) and the generated [MCP surface manifest](../contracts/mcp-live-surface.json): seventeen public reads (10 canonical multi-university tools and 7 legacy UTM compatibility aliases), twelve permissioned private reads/status/planning tools, and one private write, `update_gap_preferences`.

Preference writes remain permission-gated, typed, revision-checked, idempotent queued actions. Imported academic meetings are never writable. Personal Item tools are retired; compatibility schemas do not re-enable them.

## Planning orchestration contract

For broad personalized planning requests, clients should start with `get_my_decision_context`. For a whole-term-week search such as “find 90 minutes for studying,” clients should use `find_my_weekly_opportunities`; for one date or weekday, use `find_my_available_windows`. Models should not subtract timetable intervals themselves.

Before proposing a concrete personal block, clients should call `check_my_plan_feasibility` on the exact interval. This read-only feasibility check does not create or edit a timetable item.

When a personalized plan needs building-to-building routing or an explicit Gapwise gap calculation, clients can combine the permissioned schedule/availability tools with the stateless public campus tools. Public campus tools must never be represented as having discovered the user's private timetable or location.

Gapwise-owned deterministic facts remain authoritative: recurrence/exclusions, hard conflicts, raw versus usable gap time, gap activity budgets, setup/pack-up envelopes, route status/accuracy/confidence, buffers, and leave-by/arrival times. A model may reason about user goals and tradeoffs, but it must not upgrade missing or approximate Gapwise data into invented certainty.
