export type ConsumerProfile = {
  age: number;
  monthlyIncome: number;
  workFrequency: number;
  contentCreation: number;
  aiInterest: number;
  privacyConcern: number;
  priceSensitivity: number;
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const sigmoid = (value: number) => 1 / (1 + Math.exp(-value));

export function predictConsumer(profile: ConsumerProfile) {
  const incomeSignal = clamp((profile.monthlyIncome - 4000) / 260, 0, 45);
  const ageSignal = profile.age >= 24 && profile.age <= 42 ? 8 : profile.age < 24 ? 3 : -3;
  const raw =
    -2.9 +
    profile.aiInterest * 0.038 +
    profile.workFrequency * 0.026 +
    profile.contentCreation * 0.014 +
    incomeSignal * 0.017 +
    ageSignal * 0.035 -
    profile.priceSensitivity * 0.018 -
    profile.privacyConcern * 0.007;
  const purchaseProbability = Math.round(clamp(sigmoid(raw) * 100, 12, 94));
  const acceptedPrice = Math.round(
    clamp(
      5199 +
        profile.monthlyIncome * 0.105 +
        profile.aiInterest * 10 +
        profile.contentCreation * 8 -
        profile.priceSensitivity * 15,
      4999,
      13999,
    ) / 100,
  ) * 100;

  const featureScores = [
    { name: "AI productivity assistant", score: profile.aiInterest * 0.55 + profile.workFrequency * 0.45 },
    { name: "Local privacy protection", score: profile.privacyConcern * 0.72 + profile.aiInterest * 0.28 },
    { name: "AI video creation", score: profile.contentCreation * 0.8 + profile.aiInterest * 0.2 },
    { name: "Adaptive battery", score: profile.workFrequency * 0.68 + profile.priceSensitivity * 0.32 },
  ].sort((a, b) => b.score - a.score);

  let segment = "Practical Upgrader";
  if (profile.contentCreation >= 70 && profile.aiInterest >= 70) segment = "Premium Creator";
  else if (profile.aiInterest >= 76 && profile.priceSensitivity < 58) segment = "AI Productivity Enthusiast";
  else if (profile.age < 24) segment = "Student Explorer";
  else if (profile.aiInterest < 42) segment = "Technology Skeptic";

  return {
    purchaseProbability,
    acceptedPrice,
    topFeatures: featureScores.slice(0, 3),
    segment,
    confidence: Math.round(clamp(63 + Math.abs(purchaseProbability - 50) * 0.35, 63, 84)),
  };
}

export function simulateMarket(input: {
  price: number;
  target: "Young Professionals" | "Students" | "Creators";
  aiAssistant: boolean;
  battery: boolean;
  localAi: boolean;
  trustMessage: boolean;
}) {
  const segmentBase = {
    "Young Professionals": 24,
    Students: 17,
    Creators: 21,
  }[input.target];
  const priceEffect = (6999 - input.price) / 430;
  const featureEffect =
    (input.aiAssistant ? 4.8 : 0) +
    (input.battery ? 2.7 : 0) +
    (input.localAi ? 3.1 : 0) +
    (input.trustMessage ? 2.2 : 0);
  const targetFit =
    input.target === "Creators" && input.localAi
      ? 2.6
      : input.target === "Students" && input.price <= 5999
        ? 3.4
        : input.target === "Young Professionals" && input.aiAssistant
          ? 2.1
          : 0;
  const adoption = Math.round(clamp(segmentBase + priceEffect + featureEffect + targetFit, 8, 48));
  const revenueIndex = Math.round((input.price * adoption) / 1800);
  const marginIndex = Math.round((input.price - 4300) * adoption / 820);
  return {
    adoption,
    low: Math.max(4, adoption - 4),
    high: Math.min(55, adoption + 5),
    revenueIndex,
    marginIndex,
    recommendation:
      adoption >= 34
        ? "Scale the productivity-led offer and secure channel visibility."
        : adoption >= 27
          ? "Pilot in priority cities; lead with time saved and proof of daily utility."
          : "Rework price-value fit before a broad launch.",
  };
}

export function choiceProbabilities(input: {
  priceSensitivity: number;
  aiValue: number;
  ecosystem: number;
  brandTrust: number;
}) {
  const utilities = [
    {
      brand: "Lenovo",
      value: 1.35 + input.aiValue * 0.021 + input.brandTrust * 0.018 - input.priceSensitivity * 0.009,
    },
    {
      brand: "Dell",
      value: 0.98 + input.brandTrust * 0.014 + input.priceSensitivity * 0.002,
    },
    {
      brand: "Apple",
      value: 1.12 + input.ecosystem * 0.027 + input.brandTrust * 0.011 - input.priceSensitivity * 0.015,
    },
  ];
  const max = Math.max(...utilities.map((item) => item.value));
  const exps = utilities.map((item) => Math.exp(item.value - max));
  const sum = exps.reduce((total, value) => total + value, 0);
  return utilities.map((item, index) => ({
    brand: item.brand,
    probability: Math.round((exps[index] / sum) * 100),
  }));
}
