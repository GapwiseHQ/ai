import type { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import {
  getCampusBuilding,
  getCampusPlace,
  getUtmBuilding,
  getUtmPlace,
  listCampusBuildings,
  listCampusPlaces,
  listSupportedCampuses,
  listSupportedUniversities,
  listUtmBuildings,
  planCampusGap,
  planUtmGapWindow,
  PublicBuildingOutputSchema,
  PublicBuildingSearchOutputSchema,
  PublicBuildingsOutputSchema,
  PublicCampusesOutputSchema,
  PublicGapPlanOutputSchema,
  PublicPlaceKindSchema,
  PublicPlaceOutputSchema,
  PublicPlacesOutputSchema,
  PublicPlaceSearchOutputSchema,
  PublicRouteOutputSchema,
  PublicUniversitiesOutputSchema,
  routeBetweenCampusBuildings,
  routeBetweenUtmBuildings,
  searchCampusBuildings,
  searchCampusPlaces,
  searchUtmBuildings,
  searchUtmPlaces,
} from "@/src/domain/public-campus";
import { GapPreferencesPatchSchema, TermSchema, WeekdaySchema } from "@/src/domain/schemas";
import {
  formatPublicBuilding,
  formatPublicBuildings,
  formatPublicCampuses,
  formatPublicGapPlan,
  formatPublicPlace,
  formatPublicPlaces,
  formatPublicPlaceSearch,
  formatPublicRoute,
  formatPublicUniversities,
} from "@/src/mcp/public-campus-formatters";

type McpRegistrar = Parameters<Parameters<typeof createMcpHandler>[0]>[0];

const routePreferencesSchema = z
  .object({
    mode: z.enum(["fastest", "prefer-indoor", "step-free"]).optional(),
    walkingSpeedMps: z.number().min(0.5).max(3).optional(),
    transitionBufferMinutes: z.number().int().min(0).max(60).optional(),
  })
  .strict();

function ok(summary: string, value: Record<string, unknown>) {
  return {
    content: [{ type: "text" as const, text: summary }],
    structuredContent: value,
  };
}

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "Campus intelligence request failed.";
  return {
    content: [{ type: "text" as const, text: `Gapwise campus intelligence: ${message}` }],
    structuredContent: { error: "campus_intelligence_error", message },
    isError: true,
  };
}

export function registerPublicCampusTools(server: McpRegistrar): void {
  // ==========================================
  // Deprecated UTM Compatibility Aliases (7)
  // ==========================================

  server.registerTool(
    "list_utm_buildings",
    {
      title: "List UTM buildings known to Gapwise",
      description:
        "[DEPRECATED: Use list_campus_buildings with university='uoft' and campus='utm'] List canonical UTM buildings and Gapwise's current routing/accessibility coverage and provenance.",
      inputSchema: z.object({}).strict(),
      outputSchema: PublicBuildingsOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async () => {
      try {
        const value = await listUtmBuildings();
        return ok(formatPublicBuildings(value.buildings, "UTM"), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "search_utm_buildings",
    {
      title: "Search UTM buildings with Gapwise",
      description:
        "[DEPRECATED: Use search_campus_buildings with university='uoft' and campus='utm'] Search Gapwise's canonical UTM building directory by code, official name, or alias.",
      inputSchema: z
        .object({
          query: z.string().min(1).max(240),
          maxResults: z.number().int().min(1).max(20).default(8),
        })
        .strict(),
      outputSchema: PublicBuildingSearchOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async ({ query, maxResults }) => {
      try {
        const value = await searchUtmBuildings(query, maxResults);
        const summary = value.results.length
          ? [
              `Gapwise UTM building search for “${query}”:`,
              ...value.results.map(
                (result) =>
                  `- ${result.building.code} — ${result.building.name} (score ${result.score}; matched ${result.matchReasons.join(", ")})`,
              ),
            ].join("\n")
          : `Gapwise found no canonical UTM building matching “${query}”.`;
        return ok(summary, value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_utm_building",
    {
      title: "Get a UTM building from Gapwise",
      description:
        "[DEPRECATED: Use get_campus_building with university='uoft' and campus='utm'] Resolve one exact canonical UTM building by code, official name, or known alias and return Gapwise routing coverage, accessibility state and provenance.",
      inputSchema: z.object({ query: z.string().min(1).max(240) }).strict(),
      outputSchema: PublicBuildingOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async ({ query }) => {
      try {
        const value = await getUtmBuilding(query);
        return ok(formatPublicBuilding(value.building), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "search_utm_places",
    {
      title: "Search UTM places with Gapwise",
      description:
        "[DEPRECATED: Use search_campus_places with university='uoft' and campus='utm'] Search Gapwise's source-backed UTM place catalog for study spaces, libraries, dining, recreation, services, amenities, and facilities.",
      inputSchema: z
        .object({
          query: z.string().min(1).max(240).optional(),
          kind: PublicPlaceKindSchema.optional(),
          building: z.string().min(1).max(240).optional(),
          amenity: z.string().min(1).max(240).optional(),
          maxResults: z.number().int().min(1).max(20).default(10),
        })
        .strict()
        .refine(
          (value) => Boolean(value.query || value.kind || value.building || value.amenity),
          { message: "Provide a query or at least one place filter." },
        ),
      outputSchema: PublicPlaceSearchOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async (args) => {
      try {
        const value = await searchUtmPlaces(args);
        return ok(formatPublicPlaceSearch(value, "UTM"), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_utm_place",
    {
      title: "Get a UTM place from Gapwise",
      description:
        "[DEPRECATED: Use get_campus_place with university='uoft' and campus='utm'] Return one exact source-backed UTM campus place by canonical id.",
      inputSchema: z
        .object({
          id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).max(240),
        })
        .strict(),
      outputSchema: PublicPlaceOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async ({ id }) => {
      try {
        const value = await getUtmPlace(id);
        return ok(formatPublicPlace(value.place, value.source ?? null), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "route_between_utm_buildings",
    {
      title: "Route between UTM buildings with Gapwise",
      description:
        "[DEPRECATED: Use route_between_campus_buildings with university='uoft' and campus='utm'] Ask Gapwise's deterministic campus routing engine for a building-to-building route at UTM.",
      inputSchema: z
        .object({
          from: z.string().min(1).max(240),
          to: z.string().min(1).max(240),
          mode: z.enum(["fastest", "prefer-indoor", "step-free"]).optional(),
          walkingSpeedMps: z.number().min(0.5).max(3).optional(),
          transitionBufferMinutes: z.number().int().min(0).max(60).optional(),
        })
        .strict(),
      outputSchema: PublicRouteOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async (args) => {
      try {
        const value = await routeBetweenUtmBuildings(args);
        return ok(formatPublicRoute(value.route), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "plan_utm_gap_window",
    {
      title: "Plan a UTM gap window with Gapwise",
      description:
        "[DEPRECATED: Use plan_campus_gap with university='uoft' and campus='utm'] Plan a UTM gap window with Gapwise.",
      inputSchema: z
        .object({
          from: z.string().min(1).max(240),
          to: z.string().min(1).max(240),
          term: TermSchema,
          weekday: WeekdaySchema,
          startTime: z.number().int().min(0).max(1440),
          endTime: z.number().int().min(0).max(1440),
          routePreferences: routePreferencesSchema.optional(),
          gapPreferences: GapPreferencesPatchSchema.optional(),
        })
        .strict()
        .refine((value) => value.endTime > value.startTime, {
          message: "endTime must be after startTime",
        }),
      outputSchema: PublicGapPlanOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
      _meta: { deprecated: true },
    },
    async (args) => {
      try {
        const value = await planUtmGapWindow(args);
        return ok(formatPublicGapPlan(value.gapPlan), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  // ==========================================
  // Canonical Multi-University Campus Tools (10)
  // ==========================================

  server.registerTool(
    "list_supported_universities",
    {
      title: "List supported universities across Gapwise",
      description:
        "List all universities supported by the Gapwise platform, including canonical editions, campus models, and routing capabilities. This is public stateless campus data.",
      inputSchema: z.object({}).strict(),
      outputSchema: PublicUniversitiesOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async () => {
      try {
        const value = await listSupportedUniversities();
        return ok(formatPublicUniversities(value.universities), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "list_supported_campuses",
    {
      title: "List supported campuses across Gapwise",
      description:
        "List campus models supported across Gapwise, including routability and status. Optionally filter by university id (e.g. 'uoft', 'carleton', 'tmu', 'queens', 'laurier', 'york', 'mcmaster', 'western', 'guelph', 'uottawa', 'brock').",
      inputSchema: z
        .object({
          university: z.string().optional(),
        })
        .strict(),
      outputSchema: PublicCampusesOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ university }) => {
      try {
        const value = await listSupportedCampuses({ university });
        return ok(formatPublicCampuses(value.campuses, university), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "list_campus_buildings",
    {
      title: "List campus buildings known to Gapwise",
      description:
        "List canonical campus buildings and Gapwise routing/accessibility coverage and provenance for a specified university and campus. University parameter is required. Optionally filter by category ('academic', 'residence', 'facility').",
      inputSchema: z
        .object({
          university: z.string().min(1),
          campus: z.string().optional(),
          category: z.enum(["academic", "residence", "facility"]).optional(),
        })
        .strict(),
      outputSchema: PublicBuildingsOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ university, campus, category }) => {
      try {
        const value = await listCampusBuildings({ university, campus, category });
        const scope = `${university}${campus ? `/${campus}` : ""}${category ? ` (${category})` : ""}`;
        return ok(formatPublicBuildings(value.buildings, scope), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "search_campus_buildings",
    {
      title: "Search campus buildings with Gapwise",
      description:
        "Search Gapwise's building directory across any supported university and campus by code, official name, alias, or category. Results are ranked deterministically and include match reasons. University parameter is required.",
      inputSchema: z
        .object({
          query: z.string().min(1).max(240),
          university: z.string().min(1),
          campus: z.string().optional(),
          category: z.enum(["academic", "residence", "facility"]).optional(),
          maxResults: z.number().int().min(1).max(20).default(8),
        })
        .strict(),
      outputSchema: PublicBuildingSearchOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ query, university, campus, category, maxResults }) => {
      try {
        const value = await searchCampusBuildings(query, { university, campus, category, maxResults });
        const summary = value.results.length
          ? [
              `Gapwise building search for “${query}” (${university}${campus ? `/${campus}` : ""}):`,
              ...value.results.map(
                (result) =>
                  `- ${result.building.code} — ${result.building.name} (score ${result.score}; matched ${result.matchReasons.join(", ")})`,
              ),
            ].join("\n")
          : `No buildings matched “${query}” for ${university}${campus ? `/${campus}` : ""}.`;
        return ok(summary, value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_campus_building",
    {
      title: "Get details for a campus building with Gapwise",
      description:
        "Look up a single canonical building across any supported university and campus by code, official name, or alias. Fails closed on unknown buildings. University parameter is required.",
      inputSchema: z
        .object({
          building: z.string().min(1).max(240),
          university: z.string().min(1),
          campus: z.string().optional(),
        })
        .strict(),
      outputSchema: PublicBuildingOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ building, university, campus }) => {
      try {
        const value = await getCampusBuilding(building, { university, campus });
        return ok(formatPublicBuilding(value.building), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "list_campus_places",
    {
      title: "List campus places known to Gapwise",
      description:
        "List source-backed campus places (study spaces, dining, libraries, recreation, amenities) for a specified university and campus. University parameter is required.",
      inputSchema: z
        .object({
          university: z.string().min(1),
          campus: z.string().optional(),
        })
        .strict(),
      outputSchema: PublicPlacesOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ university, campus }) => {
      try {
        const value = await listCampusPlaces({ university, campus });
        const scope = `${university}${campus ? `/${campus}` : ""}`;
        return ok(formatPublicPlaces(value.places, scope), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "search_campus_places",
    {
      title: "Search campus places with Gapwise",
      description:
        "Search source-backed campus places for a specified university and campus. Search by name/amenity or filter by place kind and building. University parameter is required.",
      inputSchema: z
        .object({
          university: z.string().min(1),
          campus: z.string().optional(),
          query: z.string().min(1).max(240).optional(),
          kind: PublicPlaceKindSchema.optional(),
          building: z.string().min(1).max(240).optional(),
          amenity: z.string().min(1).max(240).optional(),
          maxResults: z.number().int().min(1).max(20).default(10),
        })
        .strict()
        .refine(
          (value) => Boolean(value.query || value.kind || value.building || value.amenity),
          { message: "Provide a query or at least one place filter." },
        ),
      outputSchema: PublicPlaceSearchOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      try {
        const value = await searchCampusPlaces(args);
        const scope = `${args.university}${args.campus ? `/${args.campus}` : ""}`;
        return ok(formatPublicPlaceSearch(value, scope), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "get_campus_place",
    {
      title: "Get details for a campus place with Gapwise",
      description:
        "Return one exact source-backed campus place by canonical id for a specified university and campus, including building, category, amenities, official actions, and metadata/hours provenance. University parameter is required.",
      inputSchema: z
        .object({
          id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).max(240),
          university: z.string().min(1),
          campus: z.string().optional(),
        })
        .strict(),
      outputSchema: PublicPlaceOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async ({ id, university, campus }) => {
      try {
        const value = await getCampusPlace(id, { university, campus });
        return ok(formatPublicPlace(value.place, value.source ?? null), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "route_between_campus_buildings",
    {
      title: "Route between campus buildings with Gapwise",
      description:
        "Ask Gapwise's deterministic campus routing engine for a building-to-building route across any supported university and campus. Returns routed/approximate/unavailable status, verification, time/distance and warnings without exposing the routing graph. University parameter is required.",
      inputSchema: z
        .object({
          from: z.string().min(1).max(240),
          to: z.string().min(1).max(240),
          university: z.string().min(1),
          campus: z.string().optional(),
          mode: z.enum(["fastest", "prefer-indoor", "step-free"]).optional(),
          walkingSpeedMps: z.number().min(0.5).max(3).optional(),
          transitionBufferMinutes: z.number().int().min(0).max(60).optional(),
        })
        .strict(),
      outputSchema: PublicRouteOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      try {
        const value = await routeBetweenCampusBuildings(args);
        return ok(formatPublicRoute(value.route), value);
      } catch (error) {
        return failure(error);
      }
    },
  );

  server.registerTool(
    "plan_campus_gap",
    {
      title: "Plan a campus gap window with Gapwise",
      description:
        "Run Gapwise's deterministic gap-assessment engine for an explicit free window between two building boundaries for a specified university and campus. Combines routing, transition buffer, setup/pack-up, meal-window, commute and risk preferences. University parameter is required.",
      inputSchema: z
        .object({
          from: z.string().min(1).max(240),
          to: z.string().min(1).max(240),
          university: z.string().min(1),
          campus: z.string().optional(),
          term: TermSchema,
          weekday: WeekdaySchema,
          startTime: z.number().int().min(0).max(1440),
          endTime: z.number().int().min(0).max(1440),
          routePreferences: routePreferencesSchema.optional(),
          gapPreferences: GapPreferencesPatchSchema.optional(),
        })
        .strict()
        .refine((value) => value.endTime > value.startTime, {
          message: "endTime must be after startTime",
        }),
      outputSchema: PublicGapPlanOutputSchema,
      annotations: { readOnlyHint: true, openWorldHint: true },
    },
    async (args) => {
      try {
        const value = await planCampusGap(args);
        return ok(formatPublicGapPlan(value.gapPlan), value);
      } catch (error) {
        return failure(error);
      }
    },
  );
}
