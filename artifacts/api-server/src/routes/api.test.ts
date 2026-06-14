import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import request from "supertest";

// ─── Shared mock data ─────────────────────────────────────────────────────────

const MOCK_ENTRY = {
  id: 1,
  action: "drive 20 miles",
  category: "Transport",
  co2Kg: 3.2,
  savedCo2Kg: 0.8,
  explanation: "Car journey",
  alternatives: null,
  chosenAlternative: null,
  createdAt: new Date("2024-01-15"),
  title: "First Step",
  description: "Log your first carbon estimate",
  icon: "Footprints",
  isUnlocked: true,
  progress: 1,
  target: 1,
  unlockedAt: new Date("2024-01-15"),
};

const MOCK_PROFILE = {
  id: 1,
  homeCity: "San Francisco",
  dietPreference: "omnivore",
  hasVehicle: false,
  budgetSensitivity: "medium",
  timeSensitivity: "medium",
  monthlyBudget: null,
  typicalCommute: null,
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
};

const MOCK_AGG_ROW = {
  total: 5,
  totalCo2Kg: 10.5,
  savedCo2Kg: 2.3,
  totalEntries: 3,
  date: "2024-01-15",
  category: "Transport",
  co2Kg: 3.2,
  count: 2,
  createdAt: new Date("2024-01-15"),
};

// ─── DB mock ──────────────────────────────────────────────────────────────────

type ResolveFn = (v: unknown[]) => unknown;
type RejectFn = (e: unknown) => unknown;

function makeChain(result: unknown[] = [MOCK_AGG_ROW]) {
  const chain: Record<string, unknown> = {};
  for (const m of ["from", "where", "orderBy", "limit", "offset", "groupBy", "values", "set"]) {
    chain[m] = () => chain;
  }
  chain.returning = () => Promise.resolve(result);
  chain.then = (res: ResolveFn, rej?: RejectFn) => Promise.resolve(result).then(res, rej);
  chain.catch = (fn: RejectFn) => Promise.resolve(result).catch(fn);
  return chain;
}

vi.mock("@workspace/db", () => ({
  db: {
    select: vi.fn(() => makeChain([MOCK_ENTRY, MOCK_AGG_ROW])),
    insert: vi.fn(() => makeChain([MOCK_ENTRY])),
    delete: vi.fn(() => makeChain([MOCK_ENTRY])),
    update: vi.fn(() => makeChain([MOCK_PROFILE])),
  },
  carbonEntriesTable: { id: {}, category: {}, co2Kg: {}, createdAt: {} },
  userProfileTable: { id: {} },
  achievementsTable: { id: {} },
}));

// ─── OpenAI mock ──────────────────────────────────────────────────────────────

const AI_MOCK_RESPONSE = {
  category: "General",
  co2Kg: 12.5,
  explanation: "AI-generated estimate for this novel action based on lifecycle analysis.",
  confidenceScore: 0.72,
  factors: ["Energy use (60%)", "Production (30%)", "Logistics (10%)"],
  alternatives: [
    {
      label: "Greener alternative",
      co2Kg: 3.5,
      reductionPercent: 72,
      extraTimeMinutes: null,
      moneySavedUsd: 15,
      description: "Lower-impact option",
    },
  ],
};

const mockCreate = vi.fn();

vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  })),
}));

import app from "../app.js";

beforeEach(() => {
  mockCreate.mockReset();
  // Default: AI not called (OPENAI_API_KEY absent in test env)
  delete process.env.OPENAI_API_KEY;
});

afterEach(() => {
  delete process.env.OPENAI_API_KEY;
});

// ─── Health ───────────────────────────────────────────────────────────────────

describe("GET /api/healthz", () => {
  it("returns 200 with status ok", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });
});

// ─── Carbon estimate — keyword matching ───────────────────────────────────────

describe("POST /api/carbon/estimate — keyword matching", () => {
  it("returns 200 with full estimate shape for a driving query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "drive 20 miles to work" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("co2Kg");
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("action");
    expect(res.body).toHaveProperty("alternatives");
    expect(res.body).toHaveProperty("explanation");
    expect(res.body).toHaveProperty("confidenceScore");
    expect(typeof res.body.co2Kg).toBe("number");
    expect(res.body.co2Kg).toBeGreaterThan(0);
    expect(Array.isArray(res.body.alternatives)).toBe(true);
  });

  it("identifies flight category correctly", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "flight from London to New York" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("flight");
    expect(res.body.co2Kg).toBeGreaterThan(0);
  });

  it("identifies food category for beef query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "eat a beef burger for lunch" });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("co2Kg");
    expect(res.body.category.toLowerCase()).toBe("food");
  });

  it("identifies streaming category", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "stream Netflix for 2 hours" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("streaming");
  });

  it("identifies hotel category", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "stay in a hotel for 2 nights" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("hotel");
  });

  it("handles full sentence flight query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "I am planning to fly from New York to London next week" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("flight");
  });

  it("handles driving sentence query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "I drive to work every day, about 20 miles each way" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("transport");
  });

  it("handles train sentence query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "planning to take the train from London to Edinburgh" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("transport");
  });

  it("handles cycling sentence query", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "cycling to work every morning, about 5 miles" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("transport");
  });

  it("handles food delivery sentence", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "ordering food delivery for dinner tonight" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("food");
  });

  it("echoes the full sentence in the action field", async () => {
    const query = "I want to fly from Paris to Tokyo next summer";
    const res = await request(app).post("/api/carbon/estimate").send({ query });
    expect(res.status).toBe(200);
    expect(res.body.action).toBe(query);
  });

  it("alternatives have required shape", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "take a taxi 10 miles" });
    expect(res.status).toBe(200);
    for (const alt of res.body.alternatives) {
      expect(alt).toHaveProperty("label");
      expect(alt).toHaveProperty("co2Kg");
      expect(alt).toHaveProperty("reductionPercent");
      expect(alt.reductionPercent).toBeGreaterThanOrEqual(0);
    }
  });

  it("confidenceScore is between 0 and 1", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "fly from London to New York" });
    expect(res.status).toBe(200);
    expect(res.body.confidenceScore).toBeGreaterThan(0);
    expect(res.body.confidenceScore).toBeLessThanOrEqual(1);
  });

  it("factors array is non-empty", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "beef burger for lunch" });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.factors)).toBe(true);
    expect(res.body.factors.length).toBeGreaterThan(0);
  });

  it("handles mixed-case input correctly", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "DRIVE to work" });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("transport");
  });

  it("handles query with punctuation", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "I'm flying to Paris! Excited." });
    expect(res.status).toBe(200);
    expect(res.body.category.toLowerCase()).toBe("flight");
  });
});

// ─── Carbon estimate — AI fallback ───────────────────────────────────────────

describe("POST /api/carbon/estimate — AI fallback", () => {
  it("uses AI when query has no keyword match and OPENAI_API_KEY is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(AI_MOCK_RESPONSE) } }],
    });

    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "building a data center in the desert" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("co2Kg");
    expect(res.body).toHaveProperty("alternatives");
    expect(res.body.action).toBe("building a data center in the desert");
  });

  it("returns AI response with correct shape fields", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(AI_MOCK_RESPONSE) } }],
    });

    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "manufacturing a solar panel from scratch" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("category");
    expect(res.body).toHaveProperty("explanation");
    expect(res.body).toHaveProperty("factors");
    expect(Array.isArray(res.body.factors)).toBe(true);
    expect(Array.isArray(res.body.alternatives)).toBe(true);
  });

  it("falls back to generic estimate when AI key is absent", async () => {
    // No OPENAI_API_KEY set
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "building a data center in the desert" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("co2Kg");
    expect(res.body.category).toBe("General");
  });

  it("falls back to generic estimate when AI call fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    mockCreate.mockRejectedValueOnce(new Error("API rate limit"));

    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "building a data center in the desert" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("co2Kg");
    expect(res.body.category).toBe("General");
  });

  it("does NOT call AI when keyword match is found", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";

    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "flight from London to Paris" });

    expect(res.status).toBe(200);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(res.body.category.toLowerCase()).toBe("flight");
  });

  it("AI response preserves query in action field", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(AI_MOCK_RESPONSE) } }],
    });

    const query = "running a cement factory for one hour";
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query });

    expect(res.status).toBe(200);
    expect(res.body.action).toBe(query);
  });

  it("AI confidenceScore is clamped between 0.5 and 0.92", async () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({ ...AI_MOCK_RESPONSE, confidenceScore: 0.99 }),
          },
        },
      ],
    });

    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "running a crypto mining rig all night" });

    expect(res.status).toBe(200);
    expect(res.body.confidenceScore).toBeLessThanOrEqual(0.92);
    expect(res.body.confidenceScore).toBeGreaterThanOrEqual(0.5);
  });
});

// ─── Carbon estimate — validation ────────────────────────────────────────────

describe("POST /api/carbon/estimate — validation", () => {
  it("returns 400 when query is missing", async () => {
    const res = await request(app).post("/api/carbon/estimate").send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 400 when query is empty string", async () => {
    const res = await request(app).post("/api/carbon/estimate").send({ query: "" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when query exceeds 500 characters", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "a".repeat(501) });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .set("Content-Type", "application/json")
      .send("not-json");
    expect(res.status).toBe(400);
  });
});

// ─── Carbon entries (DB-backed) ───────────────────────────────────────────────

describe("GET /api/carbon/entries", () => {
  it("returns 200 with array", async () => {
    const res = await request(app).get("/api/carbon/entries");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("accepts limit and offset params", async () => {
    const res = await request(app).get("/api/carbon/entries?limit=5&offset=0");
    expect(res.status).toBe(200);
  });

  it("accepts category filter param", async () => {
    const res = await request(app).get("/api/carbon/entries?category=transport");
    expect(res.status).toBe(200);
  });

  it("returns 400 for non-numeric limit", async () => {
    const res = await request(app).get("/api/carbon/entries?limit=abc");
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative offset", async () => {
    const res = await request(app).get("/api/carbon/entries?offset=-1");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/carbon/entries/recent", () => {
  it("returns 200 with array", async () => {
    const res = await request(app).get("/api/carbon/entries/recent");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("accepts limit param", async () => {
    const res = await request(app).get("/api/carbon/entries/recent?limit=5");
    expect(res.status).toBe(200);
  });

  it("returns 400 for non-numeric limit", async () => {
    const res = await request(app).get("/api/carbon/entries/recent?limit=abc");
    expect(res.status).toBe(400);
  });
});

describe("POST /api/carbon/entries", () => {
  it("returns 201 for valid entry", async () => {
    const res = await request(app)
      .post("/api/carbon/entries")
      .send({ action: "drive 10 miles", category: "transport", co2Kg: 2.1 });
    expect(res.status).toBe(201);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await request(app).post("/api/carbon/entries").send({ action: "test" });
    expect(res.status).toBe(400);
  });

  it("returns 400 when co2Kg is missing", async () => {
    const res = await request(app)
      .post("/api/carbon/entries")
      .send({ action: "walk to shop", category: "Transport" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/carbon/entries/:id", () => {
  it("returns 200 for existing entry", async () => {
    const res = await request(app).get("/api/carbon/entries/1");
    expect(res.status).toBe(200);
  });

  it("returns 400 for non-numeric id", async () => {
    const res = await request(app).get("/api/carbon/entries/abc");
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/carbon/entries/:id", () => {
  it("returns 204 for existing entry", async () => {
    const res = await request(app).delete("/api/carbon/entries/1");
    expect(res.status).toBe(204);
  });

  it("returns 400 for non-numeric id", async () => {
    const res = await request(app).delete("/api/carbon/entries/abc");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/carbon/stats", () => {
  it("returns 200 with stats shape", async () => {
    const res = await request(app).get("/api/carbon/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalCo2Kg");
    expect(res.body).toHaveProperty("savedCo2Kg");
    expect(res.body).toHaveProperty("totalEntries");
    expect(res.body).toHaveProperty("streakDays");
    expect(res.body).toHaveProperty("treesEquivalent");
    expect(res.body).toHaveProperty("phonesCharged");
    expect(res.body).toHaveProperty("moneySavedUsd");
  });

  it("stats values are numeric", async () => {
    const res = await request(app).get("/api/carbon/stats");
    expect(res.status).toBe(200);
    expect(typeof res.body.totalCo2Kg).toBe("number");
    expect(typeof res.body.streakDays).toBe("number");
  });
});

describe("GET /api/carbon/categories", () => {
  it("returns 200 with category breakdown array", async () => {
    const res = await request(app).get("/api/carbon/categories");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ─── Scores ───────────────────────────────────────────────────────────────────

describe("GET /api/scores", () => {
  it("returns 200 with score summary shape", async () => {
    const res = await request(app).get("/api/scores");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("daily");
    expect(res.body).toHaveProperty("weekly");
    expect(res.body).toHaveProperty("monthly");
    expect(res.body).toHaveProperty("yearly");
    expect(res.body).toHaveProperty("dailyBudget");
    expect(res.body).toHaveProperty("weeklyChange");
  });
});

describe("GET /api/scores/history", () => {
  it("returns 200 for week period", async () => {
    const res = await request(app).get("/api/scores/history?period=week");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 200 for month period", async () => {
    const res = await request(app).get("/api/scores/history?period=month");
    expect(res.status).toBe(200);
  });

  it("returns 200 for year period", async () => {
    const res = await request(app).get("/api/scores/history?period=year");
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid period", async () => {
    const res = await request(app).get("/api/scores/history?period=invalid");
    expect(res.status).toBe(400);
  });
});

// ─── Profile ─────────────────────────────────────────────────────────────────

describe("GET /api/profile", () => {
  it("returns 200 with profile shape", async () => {
    const res = await request(app).get("/api/profile");
    expect(res.status).toBe(200);
  });
});

describe("PUT /api/profile", () => {
  it("returns 200 for valid profile update", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({
        homeCity: "New York",
        dietPreference: "vegan",
        hasVehicle: false,
        budgetSensitivity: "low",
        timeSensitivity: "medium",
      });
    expect(res.status).toBe(200);
  });

  it("returns 400 for invalid diet preference", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({ dietPreference: "carnivore" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid budget sensitivity", async () => {
    const res = await request(app)
      .put("/api/profile")
      .send({ budgetSensitivity: "extreme" });
    expect(res.status).toBe(400);
  });
});

// ─── Achievements ─────────────────────────────────────────────────────────────

describe("GET /api/achievements", () => {
  it("returns 200 with achievements array", async () => {
    const res = await request(app).get("/api/achievements");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("achievements have required fields", async () => {
    const res = await request(app).get("/api/achievements");
    expect(res.status).toBe(200);
    if (res.body.length > 0) {
      const ach = res.body[0];
      expect(ach).toHaveProperty("title");
      expect(ach).toHaveProperty("isUnlocked");
    }
  });
});

// ─── Security headers ─────────────────────────────────────────────────────────

describe("Security headers", () => {
  it("includes X-Content-Type-Options nosniff", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("includes X-Frame-Options", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("includes Content-Security-Policy", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["content-security-policy"]).toBeDefined();
  });

  it("includes Strict-Transport-Security", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["strict-transport-security"]).toBeDefined();
  });

  it("includes Permissions-Policy", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["permissions-policy"]).toBeDefined();
  });

  it("includes rate limit headers", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["ratelimit"]).toBeDefined();
  });

  it("includes Referrer-Policy header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("includes Cross-Origin-Resource-Policy header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["cross-origin-resource-policy"]).toBeDefined();
  });

  it("includes Cross-Origin-Opener-Policy header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["cross-origin-opener-policy"]).toBeDefined();
  });

  it("does not expose server version header", async () => {
    const res = await request(app).get("/api/healthz");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe("Error handling", () => {
  it("returns 404 for unknown API routes", async () => {
    const res = await request(app).get("/api/does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 for unknown nested paths", async () => {
    const res = await request(app).get("/api/carbon/nonexistent-path");
    expect(res.status).toBe(404);
  });

  it("rejects oversized payload", async () => {
    const res = await request(app)
      .post("/api/carbon/estimate")
      .send({ query: "a".repeat(200), extra: "x".repeat(1024 * 101) });
    expect([400, 413]).toContain(res.status);
  });

  it("returns JSON error body for 404", async () => {
    const res = await request(app).get("/api/totally-unknown-route");
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: expect.any(String) });
  });

  it("rejects PATCH method on estimate endpoint", async () => {
    const res = await request(app).patch("/api/carbon/estimate").send({});
    expect([404, 405]).toContain(res.status);
  });
});

// ─── Carbon engine unit tests ─────────────────────────────────────────────────

describe("estimateCarbonWithScore — unit", () => {
  it("returns keywordScore > 0 for a flight query", async () => {
    const { estimateCarbonWithScore } = await import("../lib/carbon-engine.js");
    const { keywordScore } = estimateCarbonWithScore("fly from London to Paris");
    expect(keywordScore).toBeGreaterThan(0);
  });

  it("returns keywordScore 0 for a completely novel query", async () => {
    const { estimateCarbonWithScore } = await import("../lib/carbon-engine.js");
    const { keywordScore } = estimateCarbonWithScore("building a quantum computer chip factory");
    expect(keywordScore).toBe(0);
  });

  it("returns category General for a novel query fallback", async () => {
    const { estimateCarbonWithScore } = await import("../lib/carbon-engine.js");
    const { result } = estimateCarbonWithScore("zyzzy random unknown action xyz");
    expect(result.category).toBe("General");
  });

  it("echoes the query in the action field", async () => {
    const { estimateCarbonWithScore } = await import("../lib/carbon-engine.js");
    const query = "watching a movie on Netflix";
    const { result } = estimateCarbonWithScore(query);
    expect(result.action).toBe(query);
  });
});
