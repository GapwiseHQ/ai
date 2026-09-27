<div align="center">

<img src="public/logo-mark-purple.svg" width="116" alt="Gapwise AI deer mark" />

# Gapwise AI

### Permissioned intelligence on top of deterministic Gapwise truth.

**The provider-neutral Model Context Protocol (MCP) layer for public Gapwise campus intelligence and explicitly delegated student context.**

[![AI Service](https://img.shields.io/badge/AI_Service-ai.gapwise.ca-8B5CF6?style=for-the-badge&logo=vercel&logoColor=white)](https://ai.gapwise.ca/api/health)
[![MCP](https://img.shields.io/badge/MCP-Streamable_HTTP-8B5CF6?style=for-the-badge)](https://ai.gapwise.ca/api/mcp)
[![MIT](https://img.shields.io/badge/License-MIT-111111?style=for-the-badge)](LICENSE)

<sub>Next.js · TypeScript · MCP · OAuth · Supabase · Node · Vercel</sub>

<br />

**[Gapwise](https://gapwise.ca)** · **[Android](https://github.com/GapwiseHQ/android)** · **[iOS](https://github.com/GapwiseHQ/ios)** · **[AI](https://ai.gapwise.ca)** · **[Data](https://data.gapwise.ca)** · **[Docs](https://docs.gapwise.ca)** · **[Status](https://status.gapwise.ca)**

</div>

---

## What Gapwise AI is

Gapwise AI is the provider-neutral AI integration layer of **Gapwise**, a free and open-source timetable and campus-intelligence platform for university students across 11 Canadian universities (University of Toronto, Carleton University, Toronto Metropolitan University, Queen's University, Wilfrid Laurier University, York University, McMaster University, Western University, University of Guelph, University of Ottawa, and Brock University).

The main [`gapwise`](https://github.com/GapwiseHQ/gapwise) platform owns canonical student state and deterministic timetable/campus calculations. [`android`](https://github.com/GapwiseHQ/android) and [`ios`](https://github.com/GapwiseHQ/ios) provide native clients. Gapwise AI exposes a narrow remote MCP interface to bounded context rather than becoming a second timetable, routing, or planning engine.

> **Gapwise owns the facts. Connected AI clients reason over deterministic public campus data and explicitly delegated private context.**

There is no server-side LLM provider required by this repository. Compatible MCP clients supply model inference. Gapwise AI supplies schemas, deterministic context, authorization for private tools, and bounded mutation semantics.

---

## Live MCP surface

Canonical endpoint:

```text
https://ai.gapwise.ca/api/mcp
```

The release surface contains **30 tools**.

### Public, stateless campus intelligence

These seventeen tools require no private Gapwise account context:

- `list_utm_buildings`
- `search_utm_buildings`
- `get_utm_building`
- `search_utm_places`
- `get_utm_place`
- `route_between_utm_buildings`
- `plan_utm_gap_window`
- `list_supported_universities`
- `list_supported_campuses`
- `list_campus_buildings`
- `search_campus_buildings`
- `get_campus_building`
- `list_campus_places`
- `search_campus_places`
- `get_campus_place`
- `route_between_campus_buildings`
- `plan_campus_gap`

They operate on deterministic public campus data across all supported universities and campuses (10 canonical multi-university tools, with 7 legacy UTM tools remaining as thin deprecated compatibility aliases) and never read a student's timetable, friends, precise location, or private sync state.

### Permissioned private reads and planning

Twelve tools operate only on the connected user's explicitly delegated context:

- `get_ai_delegation_status`
- `get_my_day`
- `get_my_week`
- `search_my_schedule`
- `get_my_course_context`
- `get_my_schedule_range`
- `get_my_gap_plan`
- `get_my_ai_preferences`
- `get_my_decision_context`
- `find_my_available_windows`
- `find_my_weekly_opportunities`
- `check_my_plan_feasibility`

### Permissioned private writes

One tool can queue bounded user-authorized preference changes:

- `update_gap_preferences`

Academic meetings remain source-backed and **cannot be created, edited, or deleted by an AI client**. Personal Item tools are retired. Supported preference writes are typed, permission-checked, revision-bound, idempotency-bounded, and queued for Gapwise rather than granting an assistant arbitrary access to canonical encrypted state.

The generated [surface manifest](contracts/mcp-live-surface.json) is verified against tool registrations by `npm run contract:check`. After changing registrations, run `npm run contract:generate` and sync the Docs consumer with `npm run mcp-contract:sync` in the sibling Docs checkout.

For the exact behavioral contract, see [`docs/TOOL_CONTRACT.md`](docs/TOOL_CONTRACT.md).

---

## Architecture and trust boundary

```text
                         public campus request
MCP client ------------------------------------------+
                                                     |
                                                     v
                                               Gapwise AI
                                                     |
                                                     v
                                      deterministic Gapwise campus API

Gapwise web / native clients
 canonical timetable + deterministic product state
                    |
                    | explicit minimized delegation
                    v
               Gapwise AI
            OAuth + MCP boundary
                    |
       encrypted snapshot / queued action
                    v
             Supabase Postgres
                    ^
                    |
          user-scoped OAuth token
                    |
               MCP client
```

Private delegated data excludes raw ACORN `.ics`, friend data, precise/live location, account credentials, primary private-data encryption keys, and unrelated browser state. Delegated snapshots and queued actions use a separate encryption domain at rest. This is not represented as zero-knowledge encryption: authorized plaintext exists transiently during an authorized tool request.

OAuth protected-resource metadata is published at the same first-party origin. Public tools intentionally carry no private OAuth requirement; private tools require the canonical resource-bound Gapwise OAuth flow and the relevant explicit delegation permission.

---

## Release and compatibility posture

The server is intentionally provider-neutral. ChatGPT, Claude, and other compatible clients can consume the same tools, schemas, and Gapwise authorization semantics when their MCP/OAuth surfaces are compatible.

Named-client support is **evidence-gated**. Gapwise does not describe a client as production-supported until the exact current surface has passed the OAuth/read/write/revoke and negative-path matrix in [`docs/CLIENT_VALIDATION.md`](docs/CLIENT_VALIDATION.md).

The directory-review package is maintained in:

- [`docs/DIRECTORY_METADATA.md`](docs/DIRECTORY_METADATA.md)
- [`docs/REVIEWER_GUIDE.md`](docs/REVIEWER_GUIDE.md)
- [`docs/TEST_ACCOUNT_SPEC.md`](docs/TEST_ACCOUNT_SPEC.md)
- [`docs/SUBMISSION_CHECKLIST.md`](docs/SUBMISSION_CHECKLIST.md)
- [`docs/RELEASE_RUNBOOK.md`](docs/RELEASE_RUNBOOK.md)

---

## Cost model

Gapwise AI does **not** require an OpenAI or Anthropic API key for normal connector operation. The connected client supplies model inference. The backend is deliberately designed around deterministic first-party logic, bounded requests/results, and hard-cost-conscious infrastructure. See [`docs/COST_MODEL.md`](docs/COST_MODEL.md).

---

## Public developer platform

Applications that need conventional non-MCP Gapwise campus intelligence can use the canonical public API or first-party SDKs:

```bash
npm install @gapwise/sdk@0.1.2
# JSR: @gapwise/sdk@0.1.2
python -m pip install gapwise==0.1.1
```

- API: `https://api.gapwise.ca/v1`
- OpenAPI: `https://api.gapwise.ca/openapi.json`
- Docs: `https://docs.gapwise.ca`

The JavaScript/TypeScript SDK is published on npm and JSR; the Python SDK is published on PyPI. The public API/SDK surface does not grant access to delegated private AI context.

---

## Gapwise ecosystem

| Repository | Role | Primary surface |
| --- | --- | --- |
| **[`gapwise`](https://github.com/GapwiseHQ/gapwise)** | Core web/PWA, canonical timetable/gap/routing semantics, public API, OpenAPI, and SDK source | [gapwise.ca](https://gapwise.ca) / [api.gapwise.ca](https://api.gapwise.ca/v1) |
| **[`android`](https://github.com/GapwiseHQ/android)** | Native Kotlin + Jetpack Compose Android client | Android app |
| **[`ios`](https://github.com/GapwiseHQ/ios)** | Native Swift + SwiftUI iOS client | iOS app |
| **[`ai`](https://github.com/GapwiseHQ/ai)** | OAuth/MCP layer for public multi-university campus intelligence and delegated student context | [ai.gapwise.ca](https://ai.gapwise.ca) |
| **[`data`](https://github.com/GapwiseHQ/data)** | Canonical public multi-university campus data, provenance, schemas, validation, and distribution | [data.gapwise.ca](https://data.gapwise.ca) |
| **[`docs`](https://github.com/GapwiseHQ/docs)** | Canonical public developer documentation | [docs.gapwise.ca](https://docs.gapwise.ca) |
| **[`status`](https://github.com/GapwiseHQ/status)** | Independent service-health monitoring and incident communication | [status.gapwise.ca](https://status.gapwise.ca) |

All seven first-party product repositories are owned by the **Gapwise** GitHub organization (`GapwiseHQ`). Organization-wide GitHub defaults live in [`.github`](https://github.com/GapwiseHQ/.github). Andrew Muratov remains the creator and primary maintainer.

---

## Local development

Requirements: Node.js 24.x, npm, and a compatible Supabase project for authenticated/delegation flows.

```bash
git clone https://github.com/GapwiseHQ/ai.git
cd ai
npm ci
cp .env.example .env.local
npm run check
npm run dev
```

Security-sensitive changes should preserve the documented authorization, encryption, grounding, schema, and mutation boundaries. See [`docs/THREAT_MODEL.md`](docs/THREAT_MODEL.md), [`docs/PRIVACY.md`](docs/PRIVACY.md), and [`SECURITY.md`](SECURITY.md).

---

## Independent project

> **Gapwise is an independent student software project created by Andrew Muratov. It is not affiliated with, endorsed by, or an official service of the University of Toronto, Carleton University, Toronto Metropolitan University, Queen's University, Wilfrid Laurier University, York University, McMaster University, Western University, University of Guelph, University of Ottawa, or Brock University.**

## License

[MIT](LICENSE) © 2026 Andrew Muratov.

<div align="center">

**Deterministic context in. Permissioned reasoning out.**

[Open Gapwise AI →](https://ai.gapwise.ca)

</div>
