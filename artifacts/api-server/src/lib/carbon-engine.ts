export interface Alternative {
  label: string;
  co2Kg: number;
  reductionPercent: number;
  extraTimeMinutes: number | null;
  moneySavedUsd: number | null;
  description: string | null;
}

export interface EstimateResult {
  action: string;
  category: string;
  co2Kg: number;
  explanation: string;
  alternatives: Alternative[];
  confidenceScore: number;
  factors: string[];
}

interface EmissionFactor {
  keywords: string[];
  category: string;
  co2Kg: number;
  explanation: string;
  factors: string[];
  alternatives: Alternative[];
  confidenceScore: number;
}

const EMISSION_FACTORS: EmissionFactor[] = [
  {
    keywords: ["fly", "flight", "plane", "air", "airline", "hyderabad to bangalore", "london to paris", "new york to london", "domestic flight", "international flight"],
    category: "Flight",
    co2Kg: 135,
    explanation: "Aviation emits more CO₂ because takeoff and cruise altitude require enormous fuel burn. Short-haul flights are especially inefficient per km because takeoff consumes ~30% of total fuel.",
    factors: ["Fuel combustion (72%)", "Contrail warming effect (24%)", "Airport ground operations (4%)"],
    confidenceScore: 0.87,
    alternatives: [
      { label: "Train", co2Kg: 18, reductionPercent: 87, extraTimeMinutes: 300, moneySavedUsd: 45, description: "Electric rail produces 87% less CO₂ per passenger-km" },
      { label: "Bus", co2Kg: 12, reductionPercent: 91, extraTimeMinutes: 420, moneySavedUsd: 60, description: "Coach travel has the lowest emissions of motorized transport" },
      { label: "Electric car (shared)", co2Kg: 35, reductionPercent: 74, extraTimeMinutes: 180, moneySavedUsd: 20, description: "Sharing an EV dramatically cuts per-person emissions" },
    ],
  },
  {
    keywords: ["beef burger", "beef steak", "steak", "hamburger", "beef"],
    category: "Food",
    co2Kg: 6.5,
    explanation: "Beef production generates methane from cattle digestion and requires large land areas for grazing and feed crops. It is the most carbon-intensive common food.",
    factors: ["Enteric fermentation (43%)", "Feed production land use (28%)", "Manure management (14%)", "Transport (15%)"],
    confidenceScore: 0.92,
    alternatives: [
      { label: "Chicken burger", co2Kg: 2.2, reductionPercent: 66, extraTimeMinutes: null, moneySavedUsd: 2, description: "Poultry produces far less methane than ruminants" },
      { label: "Veg burger", co2Kg: 0.9, reductionPercent: 86, extraTimeMinutes: null, moneySavedUsd: 3, description: "Plant-based patty with 86% lower footprint" },
      { label: "Plant-based burger", co2Kg: 0.6, reductionPercent: 91, extraTimeMinutes: null, moneySavedUsd: 1, description: "Ultra-low emissions with meat-like taste" },
    ],
  },
  {
    keywords: ["gaming laptop", "laptop", "computer", "desktop", "macbook", "notebook"],
    category: "Shopping",
    co2Kg: 350,
    explanation: "Manufacturing electronics is energy-intensive — mining rare minerals, semiconductor fabrication, and global logistics all add up. A laptop embodies about 350 kg CO₂ during production.",
    factors: ["Manufacturing & fabrication (68%)", "Raw material extraction (18%)", "Shipping & logistics (9%)", "Retail packaging (5%)"],
    confidenceScore: 0.79,
    alternatives: [
      { label: "Refurbished equivalent", co2Kg: 70, reductionPercent: 80, extraTimeMinutes: null, moneySavedUsd: 300, description: "Refurbished devices avoid 80% of production emissions" },
      { label: "Previous generation model", co2Kg: 180, reductionPercent: 49, extraTimeMinutes: null, moneySavedUsd: 200, description: "Older certified-refurb or last-gen cuts footprint nearly in half" },
    ],
  },
  {
    keywords: ["uber suv", "suv", "large car", "4x4"],
    category: "Transport",
    co2Kg: 15,
    explanation: "SUVs and large vehicles consume 25–35% more fuel per km than compact cars. Urban trips under 5 km have higher per-km emissions due to stop-start driving.",
    factors: ["Fuel combustion (87%)", "Vehicle manufacturing allocation (8%)", "Traffic congestion overhead (5%)"],
    confidenceScore: 0.85,
    alternatives: [
      { label: "Metro / subway", co2Kg: 1.8, reductionPercent: 88, extraTimeMinutes: 10, moneySavedUsd: 12, description: "Mass transit cuts emissions by 88% for urban trips" },
      { label: "Regular rideshare (pool)", co2Kg: 6.2, reductionPercent: 59, extraTimeMinutes: 5, moneySavedUsd: 5, description: "Sharing a ride cuts per-person emissions significantly" },
      { label: "Electric bike / scooter", co2Kg: 0.5, reductionPercent: 97, extraTimeMinutes: 5, moneySavedUsd: 13, description: "Micro-mobility is nearly zero-emission for urban distances" },
      { label: "Walking", co2Kg: 0, reductionPercent: 100, extraTimeMinutes: 20, moneySavedUsd: 14, description: "Zero emissions, and good for your health" },
    ],
  },
  {
    keywords: ["uber", "taxi", "cab", "rideshare", "lyft"],
    category: "Transport",
    co2Kg: 7.8,
    explanation: "Private car trips are significantly more carbon-intensive than transit, primarily because the vehicle carries only 1–2 people instead of 40–100.",
    factors: ["Engine combustion (82%)", "Cold-start overhead (10%)", "Vehicle manufacturing share (8%)"],
    confidenceScore: 0.83,
    alternatives: [
      { label: "Metro / subway", co2Kg: 1.8, reductionPercent: 77, extraTimeMinutes: 10, moneySavedUsd: 9, description: "Transit reduces per-person CO₂ by up to 77%" },
      { label: "Cycling", co2Kg: 0.1, reductionPercent: 99, extraTimeMinutes: 15, moneySavedUsd: 12, description: "Cycling produces near-zero emissions and zero cost" },
    ],
  },
  {
    keywords: ["express delivery", "same day delivery", "next day delivery", "overnight shipping"],
    category: "Shopping",
    co2Kg: 4.8,
    explanation: "Express delivery uses dedicated vehicles or air freight with partial loads. The urgency means trucks can't be filled to capacity, raising per-package emissions.",
    factors: ["Delivery vehicle (55%)", "Air freight uplifts (30%)", "Warehouse energy (15%)"],
    confidenceScore: 0.75,
    alternatives: [
      { label: "Scheduled / grouped delivery", co2Kg: 1.2, reductionPercent: 75, extraTimeMinutes: null, moneySavedUsd: 5, description: "Batching deliveries to your neighborhood cuts emissions 75%" },
      { label: "Click-and-collect / pickup", co2Kg: 0.6, reductionPercent: 88, extraTimeMinutes: null, moneySavedUsd: 8, description: "Collecting from a nearby point eliminates last-mile delivery" },
    ],
  },
  {
    keywords: ["hotel", "hotel booking", "stay at hotel", "book hotel", "hotel room"],
    category: "Hotel",
    co2Kg: 28,
    explanation: "Hotels are energy-intensive: HVAC, lighting, pools, laundry, and restaurants run 24/7. A standard room generates ~28 kg CO₂ per night.",
    factors: ["HVAC & electricity (52%)", "Hot water & laundry (22%)", "Food service (16%)", "Pool & amenities (10%)"],
    confidenceScore: 0.81,
    alternatives: [
      { label: "Eco-certified hotel", co2Kg: 14, reductionPercent: 50, extraTimeMinutes: null, moneySavedUsd: -10, description: "Green-certified hotels use renewable energy and efficient systems" },
      { label: "Self-catering apartment", co2Kg: 8, reductionPercent: 71, extraTimeMinutes: null, moneySavedUsd: 40, description: "Cooking your own meals dramatically reduces footprint" },
    ],
  },
  {
    keywords: ["video meeting", "zoom", "teams meeting", "video call", "online meeting", "virtual meeting"],
    category: "Meeting",
    co2Kg: 0.08,
    explanation: "Video calls have a small but non-zero footprint: data centers, network infrastructure, and device energy all contribute. HD video uses ~3x more than audio-only.",
    factors: ["Data center energy (54%)", "Network transmission (28%)", "End-device power (18%)"],
    confidenceScore: 0.88,
    alternatives: [
      { label: "Audio-only call", co2Kg: 0.028, reductionPercent: 65, extraTimeMinutes: null, moneySavedUsd: null, description: "Turning off video reduces data transmission by 65%" },
    ],
  },
  {
    keywords: ["stream", "streaming", "netflix", "youtube", "video streaming", "watch video", "twitch"],
    category: "Streaming",
    co2Kg: 0.036,
    explanation: "Streaming video requires constant data center processing and content delivery networks. 4K streams use ~4x the energy of HD.",
    factors: ["Data center compute (44%)", "Network infrastructure (38%)", "Device display (18%)"],
    confidenceScore: 0.82,
    alternatives: [
      { label: "HD instead of 4K", co2Kg: 0.009, reductionPercent: 75, extraTimeMinutes: null, moneySavedUsd: null, description: "Downscaling from 4K to HD cuts streaming emissions 75%" },
      { label: "Audio podcast / music", co2Kg: 0.002, reductionPercent: 94, extraTimeMinutes: null, moneySavedUsd: null, description: "Audio-only content uses a fraction of video's bandwidth" },
    ],
  },
  {
    keywords: ["train", "rail", "railway", "amtrak", "eurostar"],
    category: "Transport",
    co2Kg: 18,
    explanation: "Electric trains are among the most efficient modes of travel. They move many passengers simultaneously with grid electricity, which is increasingly renewable.",
    factors: ["Grid electricity (65%)", "Infrastructure maintenance (25%)", "Station operations (10%)"],
    confidenceScore: 0.89,
    alternatives: [
      { label: "Bus / coach", co2Kg: 12, reductionPercent: 33, extraTimeMinutes: 60, moneySavedUsd: 15, description: "Coaches are slightly more efficient per passenger-km" },
    ],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreMatch(query: string, factor: EmissionFactor): number {
  const q = normalize(query);
  let score = 0;
  for (const keyword of factor.keywords) {
    if (q.includes(normalize(keyword))) {
      score += keyword.split(" ").length;
    }
  }
  return score;
}

export function estimateCarbon(query: string): EstimateResult {
  const scores = EMISSION_FACTORS.map((f) => ({ factor: f, score: scoreMatch(query, f) }));
  scores.sort((a, b) => b.score - a.score);

  const best = scores[0];

  if (best.score === 0) {
    // Generic fallback
    return {
      action: query,
      category: "General",
      co2Kg: 2.5,
      explanation: "This action has an estimated carbon footprint based on average consumer activity. Choosing lower-impact alternatives can significantly reduce your footprint.",
      alternatives: [
        { label: "Digital alternative", co2Kg: 0.1, reductionPercent: 96, extraTimeMinutes: null, moneySavedUsd: 10, description: "Digital options typically have a fraction of the physical footprint" },
        { label: "Second-hand / used", co2Kg: 0.5, reductionPercent: 80, extraTimeMinutes: null, moneySavedUsd: 30, description: "Buying second-hand avoids production emissions entirely" },
      ],
      confidenceScore: 0.4,
      factors: ["Production energy (50%)", "Transport & logistics (30%)", "End-of-life (20%)"],
    };
  }

  const f = best.factor;
  return {
    action: query,
    category: f.category,
    co2Kg: f.co2Kg,
    explanation: f.explanation,
    alternatives: f.alternatives,
    confidenceScore: f.confidenceScore,
    factors: f.factors,
  };
}
