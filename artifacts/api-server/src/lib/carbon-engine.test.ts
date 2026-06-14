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

    it("detects sentence-based flight queries", () => {
      const result = estimateCarbon("I am planning to book a flight to Paris next month");
      expect(result.category).toBe("Flight");
    });

    it("detects air travel phrasing", () => {
      const result = estimateCarbon("considering air travel from Mumbai to Delhi");
      expect(result.category).toBe("Flight");
    });

    it("echoes full sentence as action field", () => {
      const query = "I want to fly from Berlin to Barcelona for the weekend";
      const result = estimateCarbon(query);
      expect(result.action).toBe(query);
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

    it("detects sentence-based food queries", () => {
      const result = estimateCarbon("I am thinking of eating a beef burger for dinner");
      expect(result.category).toBe("Food");
    });

    it("detects eating pattern in sentences", () => {
      const result = estimateCarbon("planning to order food from the local restaurant tonight");
      expect(result.category).toBe("Food");
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

    it("detects full-sentence laptop purchase queries", () => {
      const result = estimateCarbon("I want to get a new laptop for my work");
      expect(result.category).toBe("Shopping");
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

    it("detects driving sentences", () => {
      const result = estimateCarbon("driving to work every day by car");
      expect(result.category).toBe("Transport");
    });

    it("detects road trip sentences", () => {
      const result = estimateCarbon("planning a road trip across the country by car");
      expect(result.category).toBe("Transport");
    });

    it("provides EV alternative for driving queries", () => {
      const result = estimateCarbon("driving 20 miles to commute each day");
      const ev = result.alternatives.find((a) =>
        a.label.toLowerCase().includes("electric"),
      );
      expect(ev).toBeDefined();
    });

    it("detects train sentences", () => {
      const result = estimateCarbon("I am thinking of taking the train to Edinburgh");
      expect(result.category).toBe("Transport");
    });

    it("detects cycling sentences", () => {
      const result = estimateCarbon("cycling to work every morning");
      expect(result.category).toBe("Transport");
    });

    it("cycling has very low CO₂", () => {
      const result = estimateCarbon("bike ride to the office");
      expect(result.co2Kg).toBeLessThan(1);
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

    it("detects binge-watching sentence", () => {
      const result = estimateCarbon("I want to binge watch a series on Netflix this weekend");
      expect(result.category).toBe("Streaming");
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

    it("detects sentence-based hotel queries", () => {
      const result = estimateCarbon("I need to book a hotel room for my trip to London");
      expect(result.category).toBe("Hotel");
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

    it("detects sentence-based meeting queries", () => {
      const result = estimateCarbon("I have a Zoom call with my team this afternoon");
      expect(result.category).toBe("Meeting");
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

    it("fallback category is General", () => {
      const result = estimateCarbon("xyzzy totally unrecognised word soup abc123");
      expect(result.category).toBe("General");
    });

    it("fallback always returns alternatives", () => {
      const result = estimateCarbon("something completely unknown to the engine");
      expect(result.alternatives.length).toBeGreaterThanOrEqual(1);
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

    it("co2Kg is always a finite number", () => {
      const queries = [
        "fly to Tokyo",
        "eat a burger",
        "drive to work",
        "watch netflix",
        "book a hotel",
        "cycling to the park",
      ];
      for (const q of queries) {
        const result = estimateCarbon(q);
        expect(Number.isFinite(result.co2Kg)).toBe(true);
      }
    });

    it("confidenceScore is always between 0 and 1", () => {
      const queries = [
        "fly to Paris",
        "uber suv",
        "beef burger",
        "totally unknown input xyz",
      ];
      for (const q of queries) {
        const result = estimateCarbon(q);
        expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(result.confidenceScore).toBeLessThanOrEqual(1);
      }
    });

    it("handles mixed-case input correctly", () => {
      const lower = estimateCarbon("fly from london to paris");
      const upper = estimateCarbon("FLY FROM LONDON TO PARIS");
      expect(lower.category).toBe(upper.category);
    });

    it("handles punctuation in sentences gracefully", () => {
      const result = estimateCarbon("I'd like to fly from London to Paris, please!");
      expect(result.category).toBe("Flight");
    });

    it("handles empty-ish queries with generic fallback", () => {
      const result = estimateCarbon("a");
      expect(result).toBeDefined();
      expect(result.co2Kg).toBeGreaterThan(0);
    });
  });

  describe("Sentence-based queries (Live Radar)", () => {
    it("handles full sentence for flight", () => {
      const result = estimateCarbon("I am planning to fly from New York to Los Angeles next week");
      expect(result.category).toBe("Flight");
    });

    it("handles full sentence for driving", () => {
      const result = estimateCarbon("I drive to work every day, about 15 miles each way");
      expect(result.category).toBe("Transport");
    });

    it("handles full sentence for food", () => {
      const result = estimateCarbon("I am thinking of having a beef steak for dinner tonight");
      expect(result.category).toBe("Food");
    });

    it("handles full sentence for streaming", () => {
      const result = estimateCarbon("I want to watch Netflix for a few hours this evening");
      expect(result.category).toBe("Streaming");
    });

    it("handles full sentence for hotel", () => {
      const result = estimateCarbon("I need to book a hotel room in Paris for 3 nights");
      expect(result.category).toBe("Hotel");
    });

    it("handles full sentence for train travel", () => {
      const result = estimateCarbon("I am planning to take the train from London to Edinburgh");
      expect(result.category).toBe("Transport");
    });

    it("returns consistent results for sentence vs keyword", () => {
      const sentence = estimateCarbon("I want to take a flight from London to Paris");
      const keyword = estimateCarbon("flight");
      expect(sentence.category).toBe(keyword.category);
    });
  });
});
