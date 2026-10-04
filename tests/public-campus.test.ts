import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CANONICAL_UNIVERSITIES,
  CANONICAL_UNIVERSITY_CAMPUSES,
  CampusIntelligenceError,
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
  routeBetweenCampusBuildings,
  routeBetweenUtmBuildings,
  searchCampusBuildings,
  searchCampusPlaces,
  searchUtmBuildings,
  searchUtmPlaces,
  validateUniversityAndCampus,
  type PublicBuilding,
  type PublicGapPlan,
  type PublicPlace,
  type PublicRoute,
} from "@/src/domain/public-campus";
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

const building: PublicBuilding = {
  code: "MN",
  name: "Maanjiwe nendamowinan",
  category: "academic",
  aliases: ["MAANJIWE NENDAMOWINAN BUILDING"],
  routingCoverage: "mapped",
  entranceCount: 1,
  verifiedEntranceCount: 1,
  accessibility: "unknown",
  indoorRoomNodeCount: 0,
  provenance: [
    {
      source: "OpenStreetMap",
      sourceUrl: "https://www.openstreetmap.org/",
      lastVerified: "2026-08-10",
      verificationStatus: "verified",
    },
  ],
  university: "uoft",
  campus: "utm",
};

const carletonBuilding: PublicBuilding = {
  code: "TB",
  name: "Tory Building",
  category: "facility",
  aliases: ["tory-building"],
  routingCoverage: "mapped",
  entranceCount: 1,
  verifiedEntranceCount: 1,
  accessibility: "unknown",
  indoorRoomNodeCount: 0,
  provenance: [
    {
      source: "OpenStreetMap",
      sourceUrl: "https://www.openstreetmap.org/",
      lastVerified: "2026-08-10",
      verificationStatus: "verified",
    },
  ],
  university: "carleton",
  campus: "carleton",
};

const ib = { ...building, code: "IB", name: "Instructional Centre" };
const carletonML = { ...carletonBuilding, code: "ML", name: "MacOdrum Library" };

const route: PublicRoute = {
  dataVersion: "2026-08-10",
  from: building,
  to: ib,
  preferences: { mode: "prefer-indoor", walkingSpeedMps: 1.2, transitionBufferMinutes: 7 },
  status: "routed",
  accuracy: "Mapped campus path, indoor estimate",
  totalDistanceMeters: 180,
  indoorDistanceMeters: 0,
  outdoorDistanceMeters: 180,
  estimatedSeconds: 150,
  floorChanges: 0,
  warnings: ["Indoor room routing is not included."],
  routeVerification: "mixed",
};

const libraryPlace: PublicPlace = {
  id: "utm-library",
  name: "Hazel McCallion Academic Learning Centre",
  kind: "library",
  buildingCode: "HM",
  summary: "UTM's library and academic learning centre.",
  amenities: ["individual study", "group study", "library services"],
  actions: [
    {
      label: "Library information and hours",
      url: "https://library.utm.utoronto.ca/",
      kind: "information",
    },
  ],
  hoursProvenance: {
    sourceId: "utm-library",
    status: "unknown",
    observedAt: "2026-08-24T00:00:00Z",
    note: "Stable place identity is published, but current operating hours are not bundled; check the official source.",
  },
  metadataProvenance: {
    sourceId: "utm-library",
    status: "verified",
    observedAt: "2026-08-24T00:00:00Z",
  },
  university: "uoft",
  campus: "utm",
};

const librarySource = {
  id: "utm-library",
  name: "UTM Library",
  url: "https://library.utm.utoronto.ca/",
  kind: "official" as const,
  retrievedAt: "2026-08-24T00:00:00Z",
};

beforeEach(() => {
  process.env.GAPWISE_SUPABASE_URL = "https://example.supabase.co";
  process.env.GAPWISE_SUPABASE_PUBLISHABLE_KEY = "publishable-key-with-enough-length";
  process.env.GAPWISE_AI_DATA_KEY = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=";
  process.env.GAPWISE_APP_ORIGIN = "https://gapwise.ca";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public campus intelligence adapter", () => {
  describe("validation and error handling", () => {
    it("rejects missing university and never falls back to UTM", () => {
      expect(() => validateUniversityAndCampus(undefined)).toThrow(CampusIntelligenceError);
      expect(() => validateUniversityAndCampus("")).toThrow(CampusIntelligenceError);
      expect(() => validateUniversityAndCampus("  ")).toThrow(
        "A valid university parameter is required",
      );
    });

    it("rejects unsupported universities with a helpful error listing valid options", () => {
      expect(() => validateUniversityAndCampus("unknown-university")).toThrow(
        'Unsupported university "unknown-university"',
      );
      expect(validateUniversityAndCampus("mcgill")).toEqual({
        university: "mcgill",
        campus: "mcgill-downtown",
      });
    });

    it("rejects unsupported campuses for a given university", () => {
      expect(() => validateUniversityAndCampus("uoft", "waterloo")).toThrow(
        'Unsupported campus "waterloo" for university "uoft"',
      );
      expect(() => validateUniversityAndCampus("carleton", "utm")).toThrow(
        'Unsupported campus "utm" for university "carleton"',
      );
    });

    it("resolves default campus when campus is omitted", () => {
      expect(validateUniversityAndCampus("uoft")).toEqual({
        university: "uoft",
        campus: "utm",
      });
      expect(validateUniversityAndCampus("carleton")).toEqual({
        university: "carleton",
        campus: "carleton",
      });
      expect(validateUniversityAndCampus("tmu")).toEqual({
        university: "tmu",
        campus: "tmu",
      });
      expect(validateUniversityAndCampus("queens")).toEqual({
        university: "queens",
        campus: "queens",
      });
      expect(validateUniversityAndCampus("laurier")).toEqual({
        university: "laurier",
        campus: "waterloo",
      });
      expect(validateUniversityAndCampus("york")).toEqual({
        university: "york",
        campus: "keele",
      });
      expect(validateUniversityAndCampus("mcmaster")).toEqual({
        university: "mcmaster",
        campus: "mcmaster",
      });
    });
  });

  describe("canonical multi-university programmatic matrix", () => {
    it("covers all 28 supported universities in the canonical registry", () => {
      expect(CANONICAL_UNIVERSITIES).toHaveLength(28);
      for (const u of CANONICAL_UNIVERSITIES) {
        const config = CANONICAL_UNIVERSITY_CAMPUSES[u];
        expect(config).toBeDefined();
        expect(config.campuses.length).toBeGreaterThanOrEqual(1);
        expect(config.campuses).toContain(config.defaultCampus);

        const resolved = validateUniversityAndCampus(u);
        expect(resolved.university).toBe(u);
        expect(resolved.campus).toBe(config.defaultCampus);
      }
    });

    it("queries buildings for any university via /v1/buildings", async () => {
      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/buildings");
        expect(url.searchParams.get("university")).toBe("carleton");
        expect(url.searchParams.get("campus")).toBe("carleton");
        return new Response(
          JSON.stringify({ data: [carletonBuilding] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const res = await listCampusBuildings({ university: "carleton" });
      expect(res.buildings).toHaveLength(1);
      expect(res.buildings[0]?.code).toBe("TB");
      expect(res.buildings[0]?.name).toBe("Tory Building");
    });

    it("searches buildings across universities", async () => {
      const fetchMock = vi.fn(async () =>
        new Response(
          JSON.stringify({ data: [carletonBuilding, carletonML] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
      vi.stubGlobal("fetch", fetchMock);

      const res = await searchCampusBuildings("Tory", { university: "carleton" });
      expect(res.results.length).toBeGreaterThanOrEqual(1);
      expect(res.results[0]?.building.code).toBe("TB");
    });

    it("gets a specific building across universities", async () => {
      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/buildings/TB");
        expect(url.searchParams.get("university")).toBe("carleton");
        return new Response(
          JSON.stringify({ data: carletonBuilding }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const res = await getCampusBuilding("TB", { university: "carleton" });
      expect(res.building.code).toBe("TB");
      expect(res.building.name).toBe("Tory Building");
    });

    it("routes between buildings for any university", async () => {
      const carletonRoute: PublicRoute = {
        ...route,
        from: carletonBuilding,
        to: carletonML,
      };
      const fetchMock = vi.fn(async (url: URL, init?: RequestInit) => {
        expect(url.pathname).toBe("/v1/routes");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          from: "TB",
          to: "ML",
          university: "carleton",
          campus: "carleton",
        });
        return new Response(
          JSON.stringify({ data: carletonRoute }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const res = await routeBetweenCampusBuildings({
        from: "TB",
        to: "ML",
        university: "carleton",
      });
      expect(res.route.from.code).toBe("TB");
      expect(res.route.to.code).toBe("ML");
      expect(formatPublicRoute(res.route)).toContain("TB (Tory Building) → ML (MacOdrum Library)");
    });

    it("plans a gap window for any university", async () => {
      const gapPlan: PublicGapPlan = {
        dataVersion: "2026-08-10",
        gap: {
          term: "Fall",
          weekday: "Monday",
          startTime: 600,
          endTime: 660,
          durationMinutes: 60,
          from: carletonBuilding,
          to: carletonML,
        },
        route: { ...route, from: carletonBuilding, to: carletonML },
        gapPreferences: {
          setupMinutes: 4,
          packUpMinutes: 3,
          lunchWindowStart: 690,
          lunchWindowEnd: 870,
          mealDurationMinutes: 30,
          willingToLeaveCampus: false,
          oneWayHomeCommuteMinutes: null,
          minimumHomeStayMinutes: 90,
          homeTurnaroundMinutes: 10,
          riskTolerance: "low",
        },
        assessment: {
          primary: {
            id: "focus-sprint",
            action: "focus-sprint",
            title: "Focus sprint",
            summary: "Good for reviewing notes.",
            score: 84,
            activityMinutes: 44,
            reasons: ["9 min is protected for travel and transition risk."],
            tags: ["route-verified"],
            timeline: [
              { kind: "setup", label: "Settle in", minutes: 4 },
              { kind: "activity", label: "Focus sprint", minutes: 44 },
              { kind: "setup", label: "Pack up", minutes: 3 },
              { kind: "travel", label: "Travel", minutes: 2 },
              { kind: "buffer", label: "Buffer", minutes: 7 },
            ],
          },
          alternatives: [],
          confidence: 0.83,
          confidenceLabel: "high",
          travelMinutes: 2,
          bufferMinutes: 7,
          leaveByMinutes: 651,
          arrivalMinutes: 653,
          fallback: false,
          routeStatus: "routed",
          routeAccuracy: "Mapped campus path, indoor estimate",
          warnings: [],
        },
      };

      const fetchMock = vi.fn(async (url: URL, init?: RequestInit) => {
        expect(url.pathname).toBe("/v1/gaps/plan");
        expect(JSON.parse(String(init?.body))).toMatchObject({
          from: "TB",
          to: "ML",
          university: "carleton",
          campus: "carleton",
          term: "Fall",
          weekday: "Monday",
        });
        return new Response(
          JSON.stringify({ data: gapPlan }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const res = await planCampusGap({
        from: "TB",
        to: "ML",
        university: "carleton",
        term: "Fall",
        weekday: "Monday",
        startTime: 600,
        endTime: 660,
      });
      expect(res.gapPlan.assessment.primary.title).toBe("Focus sprint");
      expect(formatPublicGapPlan(res.gapPlan)).toContain("Focus sprint");
    });
  });

  describe("deprecated UTM compatibility aliases delegation", () => {
    it("listUtmBuildings delegates to /v1/buildings with university=uoft and campus=utm", async () => {
      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/buildings");
        expect(url.searchParams.get("university")).toBe("uoft");
        expect(url.searchParams.get("campus")).toBe("utm");
        return new Response(
          JSON.stringify({ data: [building] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const value = await listUtmBuildings();
      expect(value.buildings[0]?.code).toBe("MN");
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("searchUtmPlaces delegates to /v1/places with university=uoft and campus=utm", async () => {
      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/places");
        expect(url.searchParams.get("university")).toBe("uoft");
        expect(url.searchParams.get("campus")).toBe("utm");
        return new Response(
          JSON.stringify({
            data: [libraryPlace],
            meta: { dataVersion: "utm-campus-state-2026-08-24" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const value = await searchUtmPlaces({
        query: "study",
        kind: "library",
        building: "HM",
        amenity: "individual",
      });
      expect(value.results).toHaveLength(1);
      expect(value.results[0]?.place.id).toBe("utm-library");
      const text = formatPublicPlaceSearch(value, "UTM");
      expect(text).toContain("Hazel McCallion Academic Learning Centre");
      expect(text).toContain("hours unknown");
      expect(text).toContain("Unknown hours are not closed");
    });

    it("getUtmPlace delegates to /v1/places/:id with university=uoft and campus=utm", async () => {
      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/places/utm-library");
        expect(url.searchParams.get("university")).toBe("uoft");
        expect(url.searchParams.get("campus")).toBe("utm");
        return new Response(
          JSON.stringify({
            data: libraryPlace,
            source: librarySource,
            meta: { dataVersion: "utm-campus-state-2026-08-24" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const value = await getUtmPlace("utm-library");
      expect(value.place.buildingCode).toBe("HM");
      const text = formatPublicPlace(value.place, value.source ?? null);
      expect(text).toContain("Operating hours: unknown");
      expect(text).toContain("Unknown does not mean closed");
      expect(text).toContain("Library information and hours");
      expect(text).toContain("UTM Library");
    });

    it("routeBetweenUtmBuildings delegates to /v1/routes with university=uoft and campus=utm", async () => {
      const fetchMock = vi.fn(async (url: URL, init?: RequestInit) => {
        expect(url.pathname).toBe("/v1/routes");
        expect(JSON.parse(String(init?.body))).toEqual({
          from: "MN",
          to: "IB",
          university: "uoft",
          campus: "utm",
          preferences: {
            mode: "prefer-indoor",
            walkingSpeedMps: 1.2,
            transitionBufferMinutes: 7,
          },
        });
        return new Response(
          JSON.stringify({ data: route }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const value = await routeBetweenUtmBuildings({
        from: "MN",
        to: "IB",
        mode: "prefer-indoor",
        walkingSpeedMps: 1.2,
        transitionBufferMinutes: 7,
      });
      expect(value.route.status).toBe("routed");
      expect(formatPublicRoute(value.route)).toContain("verification: mixed");
    });

    it("planUtmGapWindow delegates to /v1/gaps/plan with university=uoft and campus=utm", async () => {
      const gapPlan: PublicGapPlan = {
        dataVersion: "2026-08-10",
        gap: {
          term: "Fall",
          weekday: "Wednesday",
          startTime: 660,
          endTime: 780,
          durationMinutes: 120,
          from: building,
          to: ib,
        },
        route,
        gapPreferences: {
          setupMinutes: 4,
          packUpMinutes: 3,
          lunchWindowStart: 690,
          lunchWindowEnd: 870,
          mealDurationMinutes: 30,
          willingToLeaveCampus: false,
          oneWayHomeCommuteMinutes: null,
          minimumHomeStayMinutes: 90,
          homeTurnaroundMinutes: 10,
          riskTolerance: "low",
        },
        assessment: {
          primary: {
            id: "meal-window",
            action: "meal-window",
            title: "Lunch fits comfortably",
            summary: "30 min protected for eating, with time left for studying or resting.",
            score: 93,
            activityMinutes: 103,
            reasons: ["Meal target fits."],
            tags: ["lunch-time", "route-verified"],
            timeline: [
              { kind: "setup", label: "Settle in", minutes: 4 },
              { kind: "activity", label: "Meal + flexible time", minutes: 103 },
              { kind: "setup", label: "Pack up", minutes: 3 },
              { kind: "travel", label: "Travel", minutes: 3 },
              { kind: "buffer", label: "Buffer", minutes: 7 },
            ],
          },
          alternatives: [],
          confidence: 0.83,
          confidenceLabel: "high",
          travelMinutes: 3,
          bufferMinutes: 7,
          leaveByMinutes: 770,
          arrivalMinutes: 773,
          fallback: false,
          routeStatus: "routed",
          routeAccuracy: "Mapped campus path, indoor estimate",
          warnings: ["Indoor room routing is not included."],
        },
      };

      const fetchMock = vi.fn(async (url: URL, init?: RequestInit) => {
        expect(url.pathname).toBe("/v1/gaps/plan");
        const body = JSON.parse(String(init?.body));
        expect(body).toMatchObject({
          from: "MN",
          to: "IB",
          university: "uoft",
          campus: "utm",
          term: "Fall",
          weekday: "Wednesday",
          startTime: 660,
          endTime: 780,
        });
        return new Response(
          JSON.stringify({ data: gapPlan }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      });
      vi.stubGlobal("fetch", fetchMock);

      const value = await planUtmGapWindow({
        from: "MN",
        to: "IB",
        term: "Fall",
        weekday: "Wednesday",
        startTime: 660,
        endTime: 780,
        routePreferences: {
          mode: "prefer-indoor",
          walkingSpeedMps: 1.2,
          transitionBufferMinutes: 7,
        },
        gapPreferences: gapPlan.gapPreferences,
      });
      expect(value.gapPlan.assessment.primary.title).toBe("Lunch fits comfortably");
      expect(formatPublicGapPlan(value.gapPlan)).toContain("leave by 12:50");
    });

    it("filters and searches campus residences with verified category", async () => {
      const residenceBuilding: PublicBuilding = {
        code: "OPH",
        name: "Oscar Peterson Hall",
        category: "residence",
        aliases: ["OPH RESIDENCE"],
        routingCoverage: "mapped",
        entranceCount: 2,
        verifiedEntranceCount: 2,
        accessibility: "accessible",
        indoorRoomNodeCount: 0,
        provenance: [
          {
            source: "Gapwise Data",
            sourceUrl: "https://data.gapwise.ca",
            lastVerified: "2026-09-27",
            verificationStatus: "verified",
          },
        ],
        university: "uoft",
        campus: "utm",
      };

      const fetchMock = vi.fn(async (url: URL) => {
        expect(url.pathname).toBe("/v1/buildings");
        expect(url.searchParams.get("university")).toBe("uoft");
        expect(url.searchParams.get("campus")).toBe("utm");
        if (url.searchParams.get("category") === "residence") {
          return new Response(JSON.stringify({ data: [residenceBuilding] }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ data: [building, residenceBuilding] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const listing = await listCampusBuildings({
        university: "uoft",
        campus: "utm",
        category: "residence",
      });
      expect(listing.buildings).toHaveLength(1);
      expect(listing.buildings[0].category).toBe("residence");

      const search = await searchCampusBuildings("residence", {
        university: "uoft",
        campus: "utm",
      });
      expect(search.results.length).toBeGreaterThan(0);
      expect(search.results[0].building.code).toBe("OPH");
      expect(search.results[0].matchReasons).toContain("category");
    });
  });
});
