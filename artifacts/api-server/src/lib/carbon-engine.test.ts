import { describe, it, expect } from "vitest";
import { estimateCarbon } from "./carbon-engine";

describe("estimateCarbon", () => {
  describe("Flight category", () => {
    it("detects flight queries and returns Flight category", () => {
      const result = estimateCarbon("fly from New York to London");
      expect(result.category).toBe("Flight");
    });

    it("returns a positive CO₂ value for flights", () => {
      const result = estimateCarbon("take a flight from Paris to Tokyo");
      expect(result.co2Kg).toBeGreaterThan(0);
    });

    it("returns alternatives for flights", () => {
      const result = estimateCarbon("fly from London to Amsterdam");
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it("alternatives have lower CO₂ than the original", () => {
      const result = estimateCarbon("fly from Hyderabad to Bangalore");
      for (const alt of result.alternatives) {
        expect(alt.co2Kg).toBeLessThan(result.co2Kg);
      }
    });

    it("all alternatives have a reductionPercent between 0 and 100", () => {
      const result = estimateCarbon("plane ticket from Dubai to London");
      for (const alt of result.alternatives) {
        expect(alt.reductionPercent).toBeGreaterThan(0);
        expect(alt.reductionPercent).toBeLessThanOrEqual(100);
      }
    });

    it("returns a confidence score between 0 and 1", () => {
      const result = estimateCarbon("international flight booking");
      expect(result.confidenceScore).toBeGreaterThan(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(1);
    });
  });

  describe("Food category", () => {
    it("detects beef queries and returns Food category", () => {
      const result = estimateCarbon("large beef burger");
      expect(result.category).toBe("Food");
    });

    it("beef burger has CO₂ around 6-7 kg", () => {
      const result = estimateCarbon("beef burger for lunch");
      expect(result.co2Kg).toBeGreaterThan(5);
      expect(result.co2Kg).toBeLessThan(8);
    });

    it("provides plant-based alternatives for beef", () => {
      const result = estimateCarbon("beef steak dinner");
      const plantAlt = result.alternatives.find(
        (a) => a.label.toLowerCase().includes("plant") || a.label.toLowerCase().includes("veg"),
      );
      expect(plantAlt).toBeDefined();
    });

    it("plant-based alternative has very high reduction percent", () => {
      const result = estimateCarbon("large beef burger");
      const topAlt = result.alternatives.sort((a, b) => b.reductionPercent - a.reductionPercent)[0];
      expect(topAlt.reductionPercent).toBeGreaterThan(80);
    });
  });

  describe("Shopping / Electronics category", () => {
    it("detects laptop queries and returns Shopping category", () => {
      const result = estimateCarbon("gaming laptop purchase");
      expect(result.category).toBe("Shopping");
    });

    it("laptop has very high embedded carbon", () => {
      const result = estimateCarbon("buy a new gaming laptop");
      expect(result.co2Kg).toBeGreaterThan(200);
    });

    it("refurbished alternative is significantly lower", () => {
      const result = estimateCarbon("gaming laptop");
      const refurbished = result.alternatives.find((a) =>
        a.label.toLowerCase().includes("refurb"),
      );
      expect(refurbished).toBeDefined();
      expect(refurbished!.reductionPercent).toBeGreaterThan(70);
    });
  });

  describe("Transport category", () => {
    it("detects uber SUV queries and returns Transport category", () => {
      const result = estimateCarbon("Uber SUV to the airport");
      expect(result.category).toBe("Transport");
    });

    it("provides metro/public transit alternatives", () => {
      const result = estimateCarbon("uber suv ride downtown");
      const transit = result.alternatives.find(
        (a) => a.label.toLowerCase().includes("metro") || a.label.toLowerCase().includes("subway"),
      );
      expect(transit).toBeDefined();
    });

    it("metro has near-zero CO₂ relative to SUV", () => {
      const result = estimateCarbon("uber SUV");
      const metro = result.alternatives.find((a) =>
        a.label.toLowerCase().includes("metro"),
      );
      if (metro) {
        expect(metro.co2Kg).toBeLessThan(result.co2Kg * 0.2);
      }
    });
  });

  describe("Streaming category", () => {
    it("detects streaming queries", () => {
      const result = estimateCarbon("watching netflix for 2 hours");
      expect(result.category).toBe("Streaming");
    });

    it("streaming has very low CO₂ (< 1 kg)", () => {
      const result = estimateCarbon("streaming video on youtube");
      expect(result.co2Kg).toBeLessThan(1);
    });
  });

  describe("Hotel category", () => {
    it("detects hotel booking queries", () => {
      const result = estimateCarbon("book a hotel for 2 nights");
      expect(result.category).toBe("Hotel");
    });

    it("provides eco-certified alternative", () => {
      const result = estimateCarbon("hotel stay");
      const eco = result.alternatives.find(
        (a) => a.label.toLowerCase().includes("eco"),
      );
      expect(eco).toBeDefined();
    });
  });

  describe("Meeting category", () => {
    it("detects video meeting queries", () => {
      const result = estimateCarbon("zoom video call with client");
      expect(result.category).toBe("Meeting");
    });

    it("video meeting has very low CO₂", () => {
      const result = estimateCarbon("video meeting for 1 hour");
      expect(result.co2Kg).toBeLessThan(0.5);
    });
  });

  describe("Fallback / generic queries", () => {
    it("returns a result for unknown queries", () => {
      const result = estimateCarbon("something completely unrecognised xyz123");
      expect(result).toBeDefined();
      expect(result.co2Kg).toBeGreaterThan(0);
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it("returns lower confidence for unknown queries", () => {
      const result = estimateCarbon("abcdefghijk totally unknown");
      expect(result.confidenceScore).toBeLessThan(0.6);
    });

    it("always returns a non-empty explanation", () => {
      const result = estimateCarbon("random query that matches nothing");
      expect(result.explanation.length).toBeGreaterThan(10);
    });

    it("always returns at least one factor", () => {
      const result = estimateCarbon("anything at all");
      expect(result.factors.length).toBeGreaterThan(0);
    });
  });

  describe("Result shape", () => {
    it("result always has required fields", () => {
      const result = estimateCarbon("fly from Berlin to Madrid");
      expect(typeof result.action).toBe("string");
      expect(typeof result.category).toBe("string");
      expect(typeof result.co2Kg).toBe("number");
      expect(typeof result.explanation).toBe("string");
      expect(Array.isArray(result.alternatives)).toBe(true);
      expect(typeof result.confidenceScore).toBe("number");
      expect(Array.isArray(result.factors)).toBe(true);
    });

    it("echoes the input query in the action field", () => {
      const query = "book a flight to Tokyo";
      const result = estimateCarbon(query);
      expect(result.action).toBe(query);
    });

    it("all alternatives have required fields", () => {
      const result = estimateCarbon("fly from Paris to New York");
      for (const alt of result.alternatives) {
        expect(typeof alt.label).toBe("string");
        expect(typeof alt.co2Kg).toBe("number");
        expect(typeof alt.reductionPercent).toBe("number");
      }
    });
  });
});
