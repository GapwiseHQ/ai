# MCP tool contract

The live Gapwise AI MCP service registers **30 tools** through one Streamable HTTP endpoint: 17 stateless public campus-intelligence tools (10 canonical multi-university tools and 7 deprecated UTM compatibility aliases) and 13 OAuth-protected permissioned student-context tools.

Tool handlers never accept arbitrary SQL, JavaScript, URLs, graph nodes, or generic execute instructions. Imported/source-backed academic meetings remain read-only.

## Assistant-readable structured output

Private schedule/planning tools preserve their existing rich source objects for compatibility, while also exposing additive, presentation-ready projections where useful. Downstream assistants should prefer these projections for short answers instead of re-parsing prose or recomputing Gapwise facts.

- `meetingFacts` flattens day/time/course/component/location plus `semanticType`, `componentLabel`, and `isHardCommitment`. Reserved assessment placeholders use component `RES` and `isHardCommitment: false`.
- `gapPlanGroups` deduplicates equivalent gap plans. Week/term results use `appliesTo` for weekdays; date-range results use `appliesToDates`. Groups include usable time, leave-by/arrival, confidence, one key warning, and surrounding course/component/location facts.
- `flags` / `dataQualityFlags` expose deterministic schedule-data anomalies as machine-readable evidence. Flags are warnings to verify data, not claims that the source is definitely wrong.
- `actionItems` exposes relevant user-fixable setup gaps. The first supported item is a missing one-way home commute time when leaving campus is enabled, because that prevents Gapwise from evaluating go-home recommendations.

MCP text `content` is intentionally compact. Exact recurrence, exclusions, rich recommendation reasons/timelines, full warnings, and canonical source records remain in `structuredContent`.

## Public campus tools

These tools use public deterministic Gapwise campus data across all 13 supported universities and 15 campus models. They do not authenticate a Gapwise account and do not read a student's private timetable, friends, precise location, or private sync state.

### `list_supported_universities`
Lists all supported universities and campus editions across the Gapwise platform with capabilities and status.

### `list_supported_campuses`
Lists campus models supported across Gapwise, including routability and status, with optional university filter.

### `list_campus_buildings`
Lists canonical buildings for any supported university and campus with coverage and metadata. University parameter is required.

### `search_campus_buildings`
Searches canonical buildings across any supported university and campus by code, official name, or alias. University parameter is required.

### `get_campus_building`
Resolves a canonical building for any supported university and campus; unknown values fail closed. University parameter is required.

### `list_campus_places`
Lists source-backed campus places (study spaces, dining, libraries, recreation, amenities) for any supported university and campus. University parameter is required.

### `search_campus_places`
Searches source-backed campus places for any supported university and campus by query or filter. University parameter is required.

### `get_campus_place`
Returns one exact source-backed campus place by canonical id for any supported university and campus. University parameter is required.

### `route_between_campus_buildings`
Calculates deterministic building-to-building routes across any supported university and campus with confidence and verification status. University parameter is required.

### `plan_campus_gap`
Runs Gapwise's deterministic gap-assessment engine for an explicit free window between two campus buildings for any supported university and campus. University parameter is required.

### `list_utm_buildings` *(Deprecated compatibility alias)*
Deprecated: use `list_campus_buildings` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `search_utm_buildings` *(Deprecated compatibility alias)*
Deprecated: use `search_campus_buildings` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `get_utm_building` *(Deprecated compatibility alias)*
Deprecated: use `get_campus_building` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `search_utm_places` *(Deprecated compatibility alias)*
Deprecated: use `search_campus_places` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `get_utm_place` *(Deprecated compatibility alias)*
Deprecated: use `get_campus_place` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `route_between_utm_buildings` *(Deprecated compatibility alias)*
Deprecated: use `route_between_campus_buildings` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

### `plan_utm_gap_window` *(Deprecated compatibility alias)*
Deprecated: use `plan_campus_gap` with `university='uoft'` and `campus='utm'`. Delegates directly with zero divergent logic.

## Private read, status, and planning tools

These tools require a verified OAuth caller and the relevant non-revoked Gapwise AI delegation permission.

### `get_ai_delegation_status`
Returns delegation state, revision, and permissions without returning timetable content.

### `get_my_day`
Returns exact source-backed schedule occurrences for one calendar date. `academicMeetings` and `reservedAssessmentWindows` are separated, `meetingFacts` exposes flat assistant-ready facts, and `gapPlanGroups` summarizes delegated deterministic gap plans. Missing meetings, locations, routes, or recommendations are not invented.

### `get_my_week`
Returns the normalized delegated timetable for one academic term. Existing `meetings` and `gapPlans` remain available; `academicMeetings`, `reservedAssessmentWindows`, `meetingFacts`, and deduplicated weekday `gapPlanGroups` provide the preferred assistant-facing view. RES placeholders are not included in hard academic load or planning boundaries.

### `search_my_schedule`
Searches delegated meetings by course code/name, section, building, or room. Each result explicitly includes `semanticType`, `componentLabel`, and `isHardCommitment`, so an assistant does not need to infer whether a result is an ordinary commitment or RES placeholder.

### `get_my_course_context`
Resolves one delegated course without guessing. It separates ordinary academic meetings from RES placeholders, exposes flat `meetingFacts`, and returns `flags` for deterministic anomalies such as duplicate records, multiple same-section/day windows, overlapping section meetings, unusually high weekly section minutes, or late meetings.

### `get_my_schedule_range`
Returns date-specific occurrences for 1–14 consecutive days while respecting recurrence ranges and exclusions. Each day includes `meetingFacts`, and repeated equivalent gap plans are returned once in top-level `gapPlanGroups` with `appliesToDates`.

### `get_my_gap_plan`
Returns the exact precomputed deterministic Gapwise assessment for one delegated gap when gap-plan sharing is enabled. Route status/confidence, timing, warnings, recommendations, reasons, tags, and timeline fields are preserved rather than recomputed by the model.

### `get_my_ai_preferences`
Returns only planning/routing preferences the user explicitly allowed Gapwise to share with AI.

### `get_my_decision_context`
Returns a compact term-level planning summary including hard schedule load, RES count, authoritative gap opportunities, deduplicated `gapPlanGroups`, `dataQualityFlags`, relevant setup `actionItems`, route uncertainty, freshness/revision, and permitted preferences.

### `find_my_available_windows`
Finds source-backed free windows for one date or one term weekday. Without explicit search bounds it only returns windows bounded by delegated hard events; it does not invent wake/sleep assumptions or edge-of-day availability. RES placeholders are intentionally excluded from hard boundaries.

### `find_my_weekly_opportunities`
Searches all seven weekdays for usable planning windows. When an interval is covered by a delegated deterministic Gapwise gap assessment, usable activity time is capped by the Gapwise activity budget and an unavailable transition route contributes zero validated activity minutes.

### `check_my_plan_feasibility`
Checks a proposed personal block against delegated hard conflicts and, when applicable, the authoritative activity envelope/transition state for a delegated Gapwise gap. Arbitrary proposed locations are echoed but are not route-validated by this tool.

## Private write tools

### `update_gap_preferences`
Queues a bounded partial update to delegated gap-planning preferences. Requires explicit preference-write delegation and the current `expectedRevision`.

Legacy Personal Item action schemas remain decodable for compatibility, but Personal Items are retired and their create/update/delete MCP tools are no longer part of current planning semantics.

## Compatibility

The assistant-facing fields above are additive. Existing rich/raw arrays remain present, so clients that consume `meetings`, `gapPlans`, and preference objects do not need to migrate immediately. Current delegated snapshot schema v1 remains readable; this change does not require a snapshot-schema migration.

For new clients, prefer the flat assistant-facing fields for presentation and keep the rich objects as evidence when exact recurrence, route, timeline, or recommendation details are needed.

## Authentication projection

Public tools intentionally carry no OAuth `securitySchemes`. Private tools advertise Gapwise OAuth metadata in `_meta`, and the compatibility projection mirrors that declaration to root-level `securitySchemes` for clients that require it. Tool execution still independently verifies the caller; metadata is not authorization.

## Mutation semantics

A successful MCP write means **queued for Gapwise**, not that the primary encrypted private payload was remotely rewritten. Every queued mutation is typed and revision-bound; optional idempotency keys make exact retries safe. Gapwise applies pending actions against canonical browser/private-cloud state and republishes a newer snapshot.

Models must read again before making dependent changes because a queued action is not equivalent to immediate canonical-state mutation.
