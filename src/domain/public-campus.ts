import { z } from "zod";
import { getRuntimeConfig } from "@/src/config";
import { GapPreferencesSchema, TermSchema, WeekdaySchema } from "@/src/domain/schemas";

export const CANONICAL_UNIVERSITIES = [
  "uoft",
  "carleton",
  "tmu",
  "queens",
  "laurier",
  "york",
  "mcmaster",
  "western",
  "guelph",
  "uottawa",
  "brock",
] as const;

export type CanonicalUniversity = (typeof CANONICAL_UNIVERSITIES)[number];

export const CANONICAL_UNIVERSITY_CAMPUSES: Record<
  string,
  { defaultCampus: string; campuses: readonly string[] }
> = {
  uoft: { defaultCampus: "utm", campuses: ["utm", "utsg", "utsc"] },
  carleton: { defaultCampus: "carleton", campuses: ["carleton"] },
  tmu: { defaultCampus: "tmu", campuses: ["tmu"] },
  queens: { defaultCampus: "queens", campuses: ["queens"] },
  laurier: { defaultCampus: "waterloo", campuses: ["waterloo"] },
  york: { defaultCampus: "keele", campuses: ["keele"] },
  mcmaster: { defaultCampus: "mcmaster", campuses: ["mcmaster"] },
  western: { defaultCampus: "western", campuses: ["western"] },
  guelph: { defaultCampus: "guelph", campuses: ["guelph"] },
  uottawa: { defaultCampus: "uottawa", campuses: ["uottawa"] },
  brock: { defaultCampus: "brock", campuses: ["brock"] },
};

const VerificationStatusSchema = z.enum(["verified", "inferred", "unknown"]);
const AccessibilitySchema = z.enum(["accessible", "not_accessible", "unknown"]);
const RouteModeSchema = z.enum(["fastest", "prefer-indoor", "step-free"]);
const CampusFactStatusSchema = z.enum([
  "verified",
  "stale",
  "inferred",
  "user-reported",
  "unavailable",
  "unknown",
]);
export const PublicPlaceKindSchema = z.enum([
  "dining",
  "study",
  "library",
  "service",
  "recreation",
  "amenity",
  "facility",
]);

const ProvenanceSchema = z.object({
  source: z.string(),
  sourceUrl: z.string(),
  lastVerified: z.string(),
  verificationStatus: VerificationStatusSchema,
});

const CampusFactProvenanceSchema = z.object({
  sourceId: z.string().min(1),
  status: CampusFactStatusSchema,
  observedAt: z.string().min(1),
  expiresAt: z.string().min(1).optional(),
  note: z.string().optional(),
});

export const CampusSourceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  url: z.string().url(),
  kind: z.enum(["official", "open-data", "community"]),
  retrievedAt: z.string().min(1),
  refreshAfter: z.string().min(1).optional(),
  attribution: z.string().optional(),
});

const WeeklyHoursSchema = z.object({
  timezone: z.literal("America/Toronto"),
  intervals: z.record(
    z.string(),
    z.array(
      z.object({
        opens: z.string().min(1),
        closes: z.string().min(1),
      }),
    ),
  ),
});

export const PublicPlaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: PublicPlaceKindSchema,
  buildingCode: z.string().min(1),
  floorOrRoom: z.string().min(1).optional(),
  summary: z.string(),
  amenities: z.array(z.string()),
  actions: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
        kind: z.enum(["booking", "information", "report"]),
      }),
    )
    .optional(),
  hours: WeeklyHoursSchema.optional(),
  hoursProvenance: CampusFactProvenanceSchema,
  metadataProvenance: CampusFactProvenanceSchema,
  university: z.string().optional(),
  campus: z.string().optional(),
});

export const PublicBuildingSchema = z.object({
  code: z.string(),
  name: z.string(),
  category: z.enum(["academic", "residence", "facility"]),
  aliases: z.array(z.string()),
  routingCoverage: z.string(),
  entranceCount: z.number().int().nonnegative(),
  verifiedEntranceCount: z.number().int().nonnegative(),
  accessibility: AccessibilitySchema,
  indoorRoomNodeCount: z.number().int().nonnegative(),
  provenance: z.array(ProvenanceSchema),
  university: z.string().optional(),
  campus: z.string().optional(),
});

export const PublicCampusSchema = z.object({
  id: z.string(),
  universityId: z.string(),
  name: z.string(),
  shortName: z.string(),
  routable: z.boolean(),
  defaultForUniversity: z.boolean().optional(),
  status: z.string().optional(),
});

export const PublicCampusesOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  campuses: z.array(PublicCampusSchema),
});

export const PublicUniversitySchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  hostname: z.string().optional(),
  canonicalUrl: z.string().optional(),
  accentColor: z.string(),
  campuses: z.array(
    z.union([
      z.string(),
      z.object({
        id: z.string(),
        name: z.string(),
        shortName: z.string(),
        city: z.string().optional(),
        isMainCampus: z.boolean().optional(),
        routable: z.boolean().optional(),
        buildingCount: z.number().optional(),
      }),
    ]),
  ),
  campusScope: z.string().optional(),
  defaultCampus: z.string().optional(),
  hosts: z.array(z.string()).optional(),
  routableCampuses: z.array(z.string()).optional(),
  status: z.string().optional(),
});

export const PublicUniversitiesOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  universities: z.array(PublicUniversitySchema),
});

export const PublicBuildingsOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  buildings: z.array(PublicBuildingSchema),
});

export const PublicBuildingOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  building: PublicBuildingSchema,
});

export const PublicBuildingSearchOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  query: z.string().min(1).max(240),
  results: z.array(
    z.object({
      score: z.number().int().min(1).max(200),
      matchReasons: z.array(z.string().min(1).max(120)).max(8),
      building: PublicBuildingSchema,
    }),
  ),
});

export const PublicPlacesOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  places: z.array(PublicPlaceSchema),
});

export const PublicPlaceSearchOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  dataVersion: z.string(),
  query: z.string().nullable(),
  filters: z.object({
    kind: PublicPlaceKindSchema.nullable(),
    building: z.string().nullable(),
    amenity: z.string().nullable(),
  }),
  results: z.array(
    z.object({
      score: z.number().int().min(1).max(200),
      matchReasons: z.array(z.string().min(1).max(120)).max(12),
      place: PublicPlaceSchema,
      source: CampusSourceSchema.nullable(),
    }),
  ),
});

export const PublicPlaceOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  dataVersion: z.string(),
  place: PublicPlaceSchema,
  source: CampusSourceSchema.nullable().optional(),
});

export const PublicRouteSchema = z.object({
  dataVersion: z.string(),
  from: PublicBuildingSchema,
  to: PublicBuildingSchema,
  preferences: z.object({
    mode: RouteModeSchema,
    walkingSpeedMps: z.number().positive(),
    transitionBufferMinutes: z.number().int().nonnegative(),
  }),
  status: z.enum(["same-building", "routed", "approximate", "unavailable"]),
  accuracy: z.string(),
  totalDistanceMeters: z.number().nonnegative().nullable(),
  indoorDistanceMeters: z.number().nonnegative().nullable(),
  outdoorDistanceMeters: z.number().nonnegative().nullable(),
  estimatedSeconds: z.number().nonnegative().nullable(),
  floorChanges: z.number().nonnegative().nullable(),
  warnings: z.array(z.string()),
  routeVerification: z.enum(["verified", "mixed", "inferred", "unavailable"]),
});

export const PublicRouteOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  route: PublicRouteSchema,
});

const GapRecommendationSchema = z.object({
  id: z.string(),
  action: z.enum([
    "tight-transition",
    "quick-reset",
    "focus-sprint",
    "meal-window",
    "study-block",
    "deep-work-block",
    "flexible-long-gap",
    "leave-campus-candidate",
    "go-home",
    "location-dependent",
  ]),
  title: z.string(),
  summary: z.string(),
  score: z.number(),
  activityMinutes: z.number().int().nonnegative(),
  reasons: z.array(z.string()),
  tags: z.array(z.string()),
  timeline: z.array(
    z.object({
      kind: z.enum(["setup", "activity", "travel", "buffer", "flex"]),
      label: z.string(),
      minutes: z.number().int().nonnegative(),
    }),
  ),
});

const PublicGapAssessmentSchema = z.object({
  primary: GapRecommendationSchema,
  alternatives: z.array(GapRecommendationSchema),
  confidence: z.number().min(0).max(1),
  confidenceLabel: z.enum(["high", "medium", "low"]),
  travelMinutes: z.number().int().nonnegative().nullable(),
  bufferMinutes: z.number().int().nonnegative(),
  leaveByMinutes: z.number().int(),
  arrivalMinutes: z.number().int().nullable(),
  fallback: z.boolean(),
  routeStatus: z.enum(["routed", "approximate", "same-room", "unavailable"]),
  routeAccuracy: z.string(),
  warnings: z.array(z.string()),
});

export const PublicGapPlanSchema = z.object({
  dataVersion: z.string(),
  gap: z.object({
    term: TermSchema,
    weekday: WeekdaySchema,
    startTime: z.number().int().min(0).max(1440),
    endTime: z.number().int().min(0).max(1440),
    durationMinutes: z.number().int().positive(),
    from: PublicBuildingSchema,
    to: PublicBuildingSchema,
  }),
  route: PublicRouteSchema,
  gapPreferences: GapPreferencesSchema,
  assessment: PublicGapAssessmentSchema,
});

export const PublicGapPlanOutputSchema = z.object({
  service: z.literal("gapwise-public-campus"),
  gapPlan: PublicGapPlanSchema,
});

export type PublicBuilding = z.infer<typeof PublicBuildingSchema>;
export type PublicCampus = z.infer<typeof PublicCampusSchema>;
export type PublicPlace = z.infer<typeof PublicPlaceSchema>;
export type PublicPlaceKind = z.infer<typeof PublicPlaceKindSchema>;
export type PublicRoute = z.infer<typeof PublicRouteSchema>;
export type PublicGapPlan = z.infer<typeof PublicGapPlanSchema>;

export class CampusIntelligenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CampusIntelligenceError";
  }
}

export function validateUniversityAndCampus(
  universityId?: string,
  campusId?: string,
): { university: string; campus: string } {
  if (!universityId || typeof universityId !== "string" || !universityId.trim()) {
    throw new CampusIntelligenceError(
      `A valid university parameter is required (e.g. ${CANONICAL_UNIVERSITIES.map((u) => `'${u}'`).join(", ")}). Call list_supported_universities to view all options.`,
    );
  }
  const u = universityId.trim().toLowerCase();
  const entry = CANONICAL_UNIVERSITY_CAMPUSES[u];
  if (!entry) {
    throw new CampusIntelligenceError(
      `Unsupported university "${universityId}". Supported universities: ${CANONICAL_UNIVERSITIES.join(", ")}. Call list_supported_universities for details.`,
    );
  }
  if (!campusId || typeof campusId !== "string" || !campusId.trim()) {
    return { university: u, campus: entry.defaultCampus };
  }
  const c = campusId.trim().toLowerCase();
  if (!entry.campuses.includes(c)) {
    throw new CampusIntelligenceError(
      `Unsupported campus "${campusId}" for university "${u}". Valid campuses for ${u}: ${entry.campuses.join(", ")}. Call list_supported_campuses for details.`,
    );
  }
  return { university: u, campus: c };
}

async function fetchJson(path: string, init?: RequestInit): Promise<unknown> {
  const { gapwiseAppOrigin } = getRuntimeConfig();
  const response = await fetch(new URL(path, gapwiseAppOrigin), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CampusIntelligenceError("Gapwise campus intelligence returned malformed JSON.");
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "message" in body && typeof body.message === "string"
        ? body.message
        : typeof body === "object" &&
            body !== null &&
            "error" in body &&
            typeof (body as any).error === "object" &&
            (body as any).error !== null &&
            "message" in (body as any).error &&
            typeof (body as any).error.message === "string"
          ? (body as any).error.message
          : `Gapwise campus intelligence returned HTTP ${response.status}.`;
    throw new CampusIntelligenceError(message);
  }
  return body;
}

export async function listSupportedUniversities() {
  const raw = await fetchJson("/v1/universities");
  const universities = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray((raw as any)?.universities)
      ? (raw as any).universities
      : [];
  return PublicUniversitiesOutputSchema.parse({
    service: "gapwise-public-campus",
    universities,
  });
}

export async function listSupportedCampuses(options?: { university?: string }) {
  const params = new URLSearchParams();
  if (options?.university) {
    const { university } = validateUniversityAndCampus(options.university);
    params.set("university", university);
  }
  const q = params.toString() ? `?${params.toString()}` : "";
  const raw = await fetchJson(`/v1/campuses${q}`);
  const campuses = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray((raw as any)?.campuses)
      ? (raw as any).campuses
      : [];
  return PublicCampusesOutputSchema.parse({
    service: "gapwise-public-campus",
    campuses,
  });
}

export async function listCampusBuildings(options: { university: string; campus?: string }) {
  const { university, campus } = validateUniversityAndCampus(options.university, options.campus);
  const raw = await fetchJson(
    `/v1/buildings?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`,
  );
  const buildings = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray((raw as any)?.buildings)
      ? (raw as any).buildings
      : [];
  return PublicBuildingsOutputSchema.parse({
    service: "gapwise-public-campus",
    buildings,
  });
}

export async function listUtmBuildings() {
  return listCampusBuildings({ university: "uoft", campus: "utm" });
}

function normalizeSearch(value: string): string {
  return value.toLocaleLowerCase("en-CA").replace(/[^a-z0-9]+/gu, " ").trim();
}

function buildingMatch(query: string, building: PublicBuilding) {
  const q = normalizeSearch(query);
  const compactQuery = q.replace(/\s+/gu, "");
  const candidates = [
    ["code", building.code, 200, 190, 180, 170],
    ["official name", building.name, 185, 170, 160, 150],
    ...building.aliases.map((alias) => ["alias", alias, 180, 165, 155, 145] as const),
  ] as const;
  let score = 0;
  const reasons: string[] = [];
  for (const [label, raw, exact, prefix, token, contains] of candidates) {
    const value = normalizeSearch(raw);
    let current = 0;
    if (value === q) current = exact;
    else if (value.startsWith(q)) current = prefix;
    else if (value.split(/\s+/u).some((part) => part === q || part.startsWith(q))) current = token;
    else if (value.includes(q)) current = contains;
    else if (compactQuery && value.replace(/\s+/gu, "").includes(compactQuery)) current = contains - 5;
    if (current > 0) reasons.push(label);
    score = Math.max(score, current);
  }
  return { score, reasons: [...new Set(reasons)] };
}

export async function searchCampusBuildings(
  query: string,
  options: { university: string; campus?: string; maxResults?: number },
) {
  const { university, campus } = validateUniversityAndCampus(options.university, options.campus);
  const { buildings } = await listCampusBuildings({ university, campus });
  const results = buildings
    .map((building) => {
      const match = buildingMatch(query, building);
      return { score: match.score, matchReasons: match.reasons, building };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.building.code.localeCompare(b.building.code))
    .slice(0, options.maxResults ?? 8);
  return PublicBuildingSearchOutputSchema.parse({
    service: "gapwise-public-campus",
    query,
    results,
  });
}

export async function searchUtmBuildings(query: string, maxResults = 8) {
  return searchCampusBuildings(query, { university: "uoft", campus: "utm", maxResults });
}

export async function getCampusBuilding(
  query: string,
  options: { university: string; campus?: string },
) {
  const { university, campus } = validateUniversityAndCampus(options.university, options.campus);
  const raw = await fetchJson(
    `/v1/buildings/${encodeURIComponent(query)}?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`,
  );
  const building = (raw as any)?.data ?? (raw as any)?.building;
  return PublicBuildingOutputSchema.parse({
    service: "gapwise-public-campus",
    building,
  });
}

export async function getUtmBuilding(query: string) {
  return getCampusBuilding(query, { university: "uoft", campus: "utm" });
}

function placeMatch(query: string | undefined, place: PublicPlace) {
  if (!query) return { score: 100, reasons: ["filter match"] };
  const q = normalizeSearch(query);
  const candidates = [
    ["canonical id", place.id, 200, 190, 170],
    ["place name", place.name, 195, 185, 165],
    ["summary", place.summary, 150, 145, 135],
    ["building", place.buildingCode, 175, 165, 150],
    ...place.amenities.map((amenity) => ["amenity", amenity, 165, 155, 145] as const),
  ] as const;
  let score = 0;
  const reasons: string[] = [];
  for (const [label, raw, exact, prefix, contains] of candidates) {
    const value = normalizeSearch(raw);
    let current = 0;
    if (value === q) current = exact;
    else if (value.startsWith(q)) current = prefix;
    else if (value.includes(q) || q.includes(value)) current = contains;
    if (current > 0) reasons.push(label);
    score = Math.max(score, current);
  }
  return { score, reasons: [...new Set(reasons)] };
}

export async function listCampusPlaces(options: { university: string; campus?: string }) {
  const { university, campus } = validateUniversityAndCampus(options.university, options.campus);
  const raw = await fetchJson(
    `/v1/places?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`,
  );
  const places = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray((raw as any)?.places)
      ? (raw as any).places
      : [];
  return PublicPlacesOutputSchema.parse({
    service: "gapwise-public-campus",
    places,
  });
}

export async function searchCampusPlaces(input: {
  university: string;
  campus?: string;
  query?: string;
  kind?: PublicPlaceKind;
  building?: string;
  amenity?: string;
  maxResults?: number;
}) {
  const { university, campus } = validateUniversityAndCampus(input.university, input.campus);
  const raw = await fetchJson(
    `/v1/places?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`,
  );
  const placesRaw: PublicPlace[] = Array.isArray((raw as any)?.data)
    ? (raw as any).data
    : Array.isArray((raw as any)?.places)
      ? (raw as any).places
      : [];
  const meta = (raw as any)?.meta;
  const dataVersion = meta?.dataVersion ?? "campus-state";
  const query = input.query?.trim() || undefined;
  const building = input.building?.trim() || undefined;
  const amenity = input.amenity?.trim() || undefined;

  const results = placesRaw
    .filter((place) => !input.kind || place.kind === input.kind)
    .filter(
      (place) =>
        !building || normalizeSearch(place.buildingCode) === normalizeSearch(building),
    )
    .filter(
      (place) =>
        !amenity ||
        place.amenities.some((item) => normalizeSearch(item).includes(normalizeSearch(amenity))),
    )
    .map((place) => {
      const match = placeMatch(query, place);
      const reasons = [...match.reasons];
      if (input.kind) reasons.push("kind");
      if (building) reasons.push("building");
      if (amenity) reasons.push("amenity");
      return {
        score: match.score,
        matchReasons: [...new Set(reasons)],
        place,
        source: null,
      };
    })
    .filter((item) => !query || item.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, input.maxResults ?? 10);

  return PublicPlaceSearchOutputSchema.parse({
    service: "gapwise-public-campus",
    dataVersion,
    query: query ?? null,
    filters: {
      kind: input.kind ?? null,
      building: building ?? null,
      amenity: amenity ?? null,
    },
    results,
  });
}

export async function searchUtmPlaces(input: {
  query?: string;
  kind?: PublicPlaceKind;
  building?: string;
  amenity?: string;
  maxResults?: number;
}) {
  return searchCampusPlaces({
    ...input,
    university: "uoft",
    campus: "utm",
  });
}

export async function getCampusPlace(
  id: string,
  options: { university: string; campus?: string },
) {
  const { university, campus } = validateUniversityAndCampus(options.university, options.campus);
  const raw = await fetchJson(
    `/v1/places/${encodeURIComponent(id)}?university=${encodeURIComponent(university)}&campus=${encodeURIComponent(campus)}`,
  );
  const place = (raw as any)?.data ?? (raw as any)?.place;
  const source = (raw as any)?.source ?? null;
  const dataVersion = (raw as any)?.meta?.dataVersion ?? "campus-state";
  return PublicPlaceOutputSchema.parse({
    service: "gapwise-public-campus",
    dataVersion,
    place,
    source,
  });
}

export async function getUtmPlace(id: string) {
  return getCampusPlace(id, { university: "uoft", campus: "utm" });
}

export async function routeBetweenCampusBuildings(input: {
  from: string;
  to: string;
  university: string;
  campus?: string;
  mode?: z.infer<typeof RouteModeSchema>;
  walkingSpeedMps?: number;
  transitionBufferMinutes?: number;
}) {
  const { university, campus } = validateUniversityAndCampus(input.university, input.campus);
  const preferences = {
    ...(input.mode !== undefined ? { mode: input.mode } : {}),
    ...(input.walkingSpeedMps !== undefined ? { walkingSpeedMps: input.walkingSpeedMps } : {}),
    ...(input.transitionBufferMinutes !== undefined
      ? { transitionBufferMinutes: input.transitionBufferMinutes }
      : {}),
  };
  const raw = await fetchJson("/v1/routes", {
    method: "POST",
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      university,
      campus,
      preferences: Object.keys(preferences).length > 0 ? preferences : undefined,
    }),
  });
  const route = (raw as any)?.data ?? (raw as any)?.route;
  return PublicRouteOutputSchema.parse({
    service: "gapwise-public-campus",
    route,
  });
}

export async function routeBetweenUtmBuildings(input: {
  from: string;
  to: string;
  mode?: z.infer<typeof RouteModeSchema>;
  walkingSpeedMps?: number;
  transitionBufferMinutes?: number;
}) {
  return routeBetweenCampusBuildings({
    ...input,
    university: "uoft",
    campus: "utm",
  });
}

export async function planCampusGap(input: {
  from: string;
  to: string;
  university: string;
  campus?: string;
  term: z.infer<typeof TermSchema>;
  weekday: z.infer<typeof WeekdaySchema>;
  startTime: number;
  endTime: number;
  routePreferences?: {
    mode?: z.infer<typeof RouteModeSchema>;
    walkingSpeedMps?: number;
    transitionBufferMinutes?: number;
  } | null;
  gapPreferences?: Partial<z.infer<typeof GapPreferencesSchema>> | null;
}) {
  const { university, campus } = validateUniversityAndCampus(input.university, input.campus);
  const raw = await fetchJson("/v1/gaps/plan", {
    method: "POST",
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      university,
      campus,
      term: input.term,
      weekday: input.weekday,
      startTime: input.startTime,
      endTime: input.endTime,
      routePreferences: input.routePreferences ?? undefined,
      gapPreferences: input.gapPreferences ?? undefined,
    }),
  });
  const gapPlan = (raw as any)?.data ?? (raw as any)?.gapPlan;
  return PublicGapPlanOutputSchema.parse({
    service: "gapwise-public-campus",
    gapPlan,
  });
}

export async function planUtmGapWindow(input: {
  from: string;
  to: string;
  term: z.infer<typeof TermSchema>;
  weekday: z.infer<typeof WeekdaySchema>;
  startTime: number;
  endTime: number;
  routePreferences?: {
    mode?: z.infer<typeof RouteModeSchema>;
    walkingSpeedMps?: number;
    transitionBufferMinutes?: number;
  } | null;
  gapPreferences?: Partial<z.infer<typeof GapPreferencesSchema>> | null;
}) {
  return planCampusGap({
    ...input,
    university: "uoft",
    campus: "utm",
  });
}
