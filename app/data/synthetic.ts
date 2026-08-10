export type SegmentName =
  | "AI Productivity Enthusiasts"
  | "Practical Upgraders"
  | "Technology Skeptics"
  | "Students"
  | "Premium Creators";

export const marketTrend = [
  { period: "24 Q1", adoption: 8, low: 8, high: 8, awareness: 31, intent: 18 },
  { period: "24 Q2", adoption: 9, low: 9, high: 9, awareness: 35, intent: 20 },
  { period: "24 Q3", adoption: 11, low: 11, high: 11, awareness: 41, intent: 23 },
  { period: "24 Q4", adoption: 13, low: 13, high: 13, awareness: 46, intent: 26 },
  { period: "25 Q1", adoption: 15, low: 15, high: 15, awareness: 51, intent: 29 },
  { period: "25 Q2", adoption: 17, low: 17, high: 17, awareness: 55, intent: 32 },
  { period: "25 Q3", adoption: 19, low: 19, high: 19, awareness: 60, intent: 36 },
  { period: "25 Q4", adoption: 21, low: 21, high: 21, awareness: 63, intent: 39 },
  { period: "26 Q1", adoption: 23, low: 23, high: 23, awareness: 66, intent: 42 },
  { period: "26 Q2", adoption: 24, low: 24, high: 24, awareness: 68, intent: 45 },
  { period: "26 Q3", adoption: 26, low: 23, high: 29, awareness: 71, intent: 48 },
  { period: "26 Q4", adoption: 28, low: 24, high: 32, awareness: 73, intent: 51 },
  { period: "27 Q1", adoption: 30, low: 25, high: 35, awareness: 75, intent: 54 },
  { period: "27 Q2", adoption: 32, low: 26, high: 38, awareness: 77, intent: 56 },
  { period: "27 Q3", adoption: 34, low: 27, high: 41, awareness: 79, intent: 59 },
  { period: "27 Q4", adoption: 36, low: 28, high: 44, awareness: 81, intent: 61 },
  { period: "28 Q1", adoption: 38, low: 29, high: 47, awareness: 82, intent: 63 },
  { period: "28 Q2", adoption: 40, low: 30, high: 50, awareness: 83, intent: 65 },
  { period: "28 Q3", adoption: 42, low: 31, high: 53, awareness: 84, intent: 67 },
  { period: "28 Q4", adoption: 44, low: 32, high: 56, awareness: 85, intent: 69 },
  { period: "29 Q1", adoption: 46, low: 33, high: 59, awareness: 86, intent: 71 },
  { period: "29 Q2", adoption: 48, low: 34, high: 62, awareness: 87, intent: 73 },
  { period: "29 Q3", adoption: 50, low: 35, high: 65, awareness: 88, intent: 75 },
  { period: "29 Q4", adoption: 52, low: 36, high: 68, awareness: 89, intent: 77 },
];

export const segments: Array<{
  name: SegmentName;
  short: string;
  size: number;
  probability: number;
  opportunity: number;
  traits: string[];
  color: string;
}> = [
  {
    name: "AI Productivity Enthusiasts",
    short: "Productivity",
    size: 22,
    probability: 82,
    opportunity: 86,
    traits: ["High AI interest", "High willingness to pay", "Heavy work use"],
    color: "#2468c9",
  },
  {
    name: "Practical Upgraders",
    short: "Practical",
    size: 35,
    probability: 64,
    opportunity: 78,
    traits: ["Productivity-led", "Proof-seeking", "Medium price sensitivity"],
    color: "#5b7fa8",
  },
  {
    name: "Technology Skeptics",
    short: "Skeptics",
    size: 18,
    probability: 38,
    opportunity: 41,
    traits: ["Low trust", "Privacy concern", "Upgrade inertia"],
    color: "#8c96a3",
  },
  {
    name: "Students",
    short: "Students",
    size: 15,
    probability: 55,
    opportunity: 66,
    traits: ["High curiosity", "Budget constrained", "Study + creation"],
    color: "#b07a25",
  },
  {
    name: "Premium Creators",
    short: "Creators",
    size: 10,
    probability: 76,
    opportunity: 72,
    traits: ["Performance-first", "Local AI value", "Premium price acceptance"],
    color: "#67579b",
  },
];

export const segmentPoints = [
  { id: "R018", x: 84, y: 28, size: 164, segment: "Productivity" },
  { id: "R104", x: 78, y: 35, size: 141, segment: "Productivity" },
  { id: "R211", x: 91, y: 22, size: 118, segment: "Productivity" },
  { id: "R326", x: 74, y: 31, size: 133, segment: "Productivity" },
  { id: "R037", x: 63, y: 51, size: 192, segment: "Practical" },
  { id: "R085", x: 57, y: 58, size: 178, segment: "Practical" },
  { id: "R144", x: 68, y: 46, size: 170, segment: "Practical" },
  { id: "R260", x: 61, y: 55, size: 185, segment: "Practical" },
  { id: "R411", x: 54, y: 63, size: 147, segment: "Practical" },
  { id: "R052", x: 29, y: 62, size: 116, segment: "Skeptics" },
  { id: "R193", x: 34, y: 71, size: 121, segment: "Skeptics" },
  { id: "R284", x: 23, y: 67, size: 105, segment: "Skeptics" },
  { id: "R071", x: 69, y: 84, size: 96, segment: "Students" },
  { id: "R159", x: 76, y: 91, size: 101, segment: "Students" },
  { id: "R302", x: 61, y: 78, size: 110, segment: "Students" },
  { id: "R436", x: 72, y: 88, size: 92, segment: "Students" },
  { id: "R114", x: 93, y: 39, size: 86, segment: "Creators" },
  { id: "R227", x: 88, y: 44, size: 91, segment: "Creators" },
  { id: "R349", x: 96, y: 32, size: 82, segment: "Creators" },
  { id: "R480", x: 86, y: 48, size: 88, segment: "Creators" },
];

export const featureValues = [
  { feature: "AI Assistant", overall: 85, productivity: 94, creators: 88, students: 76, impact: 12.4 },
  { feature: "Local AI Processing", overall: 79, productivity: 84, creators: 92, students: 68, impact: 10.8 },
  { feature: "Battery Optimization", overall: 74, productivity: 81, creators: 69, students: 78, impact: 8.6 },
  { feature: "Security Protection", overall: 71, productivity: 83, creators: 72, students: 61, impact: 7.4 },
  { feature: "AI Video Editing", overall: 63, productivity: 58, creators: 96, students: 72, impact: 6.8 },
];

export const adoptionDrivers = [
  { driver: "AI productivity benefit", importance: 32, direction: "+" },
  { driver: "Battery improvement", importance: 21, direction: "+" },
  { driver: "Privacy & security", importance: 18, direction: "+" },
  { driver: "Brand trust", importance: 15, direction: "+" },
  { driver: "Price sensitivity", importance: 14, direction: "−" },
];

export const researchProjects = [
  { id: "RP-25018", title: "AI PC Consumer Study 2025", market: "CN / US / DE", sample: 3000, year: 2025, tags: ["AI perception", "purchase barrier", "feature value"], insight: "Daily productivity proof closes more of the intent gap than technology claims." },
  { id: "RP-24042", title: "Laptop Usage Study 2024", market: "Global 8 markets", sample: 5000, year: 2024, tags: ["consumer needs", "usage occasions", "upgrade cycle"], insight: "Battery life and workflow continuity remain universal upgrade anchors." },
  { id: "TR-23001", title: "Technology Adoption Tracker", market: "China", sample: 12800, year: 2026, tags: ["tracking", "AI awareness", "brand consideration"], insight: "AI awareness is rising faster than concrete value understanding." },
  { id: "CJ-26007", title: "Premium Notebook Conjoint", market: "China", sample: 1600, year: 2026, tags: ["choice model", "price elasticity", "brand"], insight: "RMB 6,999 is the highest-volume conversion point in the current synthetic design." },
  { id: "QL-25011", title: "AI Workflows Qualitative Lab", market: "CN / SG", sample: 48, year: 2025, tags: ["consumer needs", "privacy", "workflows"], insight: "Users describe outcomes—time saved and fewer interruptions—not AI specifications." },
];

export const modelRegistry = [
  { name: "Purchase Propensity", family: "Logistic + XGBoost challenger", target: "AI PC purchase within 12 months", validation: "Temporal holdout", score: "AUC 0.78", status: "Demo validated", refresh: "Each wave" },
  { name: "Adoption Forecast", family: "Bayesian diffusion + DGLM", target: "Quarterly AI PC penetration", validation: "Rolling-origin backtest", score: "MAPE 8.4%", status: "Demo validated", refresh: "Monthly" },
  { name: "Brand Choice", family: "Hierarchical Bayes MNL", target: "Lenovo / Dell / Apple choice", validation: "Holdout choice tasks", score: "Hit rate 67%", status: "Demo validated", refresh: "Quarterly" },
  { name: "Consumer Digital Twin", family: "Calibrated ensemble", target: "Purchase, feature and price response", validation: "Profile-level calibration", score: "Brier 0.16", status: "Prototype", refresh: "On demand" },
  { name: "Needs Segmentation", family: "K-prototypes + stability test", target: "Consumer need-state membership", validation: "Bootstrap stability", score: "ARI 0.71", status: "Demo validated", refresh: "Semiannual" },
];

export const dataAssets = [
  { source: "Tracking survey", coverage: "2023 Q1 – 2026 Q2", grain: "Respondent × wave", rows: "38.4k", freshness: "18 Jul 2026", state: "Ready" },
  { source: "Product & concept tests", coverage: "14 studies / 9 markets", grain: "Concept × market × study", rows: "22.7k", freshness: "30 Jun 2026", state: "Ready" },
  { source: "Choice exercises", coverage: "6 conjoint studies", grain: "Task × alternative × respondent", rows: "216k", freshness: "30 Jun 2026", state: "Ready" },
  { source: "Sales / channel outcomes", coverage: "Awaiting client match", grain: "SKU × market × week", rows: "—", freshness: "Not connected", state: "Gap" },
  { source: "CRM & campaign exposure", coverage: "Awaiting clean-room feed", grain: "Anonymous consumer × event", rows: "—", freshness: "Not connected", state: "Gap" },
];

export const annualForecast = [
  { year: "2027", base: 36, low: 28, high: 44, delta: "+12 pts" },
  { year: "2028", base: 44, low: 32, high: 56, delta: "+8 pts" },
  { year: "2029", base: 52, low: 36, high: 68, delta: "+8 pts" },
];

export const campaignWeekly = [
  { week: "Pre 4", exposed: 33, control: 33, reach: 0 },
  { week: "Pre 3", exposed: 34, control: 34, reach: 0 },
  { week: "Pre 2", exposed: 34, control: 35, reach: 0 },
  { week: "Pre 1", exposed: 35, control: 35, reach: 0 },
  { week: "W1", exposed: 37, control: 35, reach: 18 },
  { week: "W2", exposed: 39, control: 36, reach: 31 },
  { week: "W3", exposed: 41, control: 36, reach: 44 },
  { week: "W4", exposed: 43, control: 37, reach: 56 },
  { week: "W5", exposed: 45, control: 37, reach: 64 },
  { week: "W6", exposed: 46, control: 38, reach: 71 },
  { week: "W7", exposed: 47, control: 39, reach: 76 },
  { week: "W8", exposed: 48, control: 40, reach: 80 },
];

export const campaignFunnel = [
  { metric: "Aided awareness", exposed: 78, control: 68, lift: 10, low: 7.1, high: 12.9, confidence: "High" },
  { metric: "World Cup × Lenovo link", exposed: 63, control: 41, lift: 22, low: 18.4, high: 25.6, confidence: "High" },
  { metric: "AI value understanding", exposed: 57, control: 49, lift: 8, low: 4.6, high: 11.4, confidence: "High" },
  { metric: "AI PC consideration", exposed: 48, control: 40, lift: 8, low: 4.1, high: 11.9, confidence: "High" },
  { metric: "12-month purchase intent", exposed: 31, control: 27, lift: 4, low: 0.8, high: 7.2, confidence: "Directional" },
];

export const audienceUplift = [
  { audience: "AI productivity users", lift: 12.8, low: 8.3, high: 17.3, n: 842, reach: 74 },
  { audience: "Young professionals", lift: 10.6, low: 6.8, high: 14.4, n: 1104, reach: 81 },
  { audience: "Football-first fans", lift: 7.9, low: 3.6, high: 12.2, n: 976, reach: 88 },
  { audience: "Premium creators", lift: 6.4, low: 1.5, high: 11.3, n: 418, reach: 69 },
  { audience: "Students", lift: 3.1, low: -1.2, high: 7.4, n: 721, reach: 77 },
  { audience: "Technology skeptics", lift: 0.8, low: -3.6, high: 5.2, n: 639, reach: 52 },
];

export const creativeDiagnostics = [
  { signal: "Stops attention", score: 84, benchmark: 72, meaning: "Beckham + football creates strong stopping power." },
  { signal: "Lenovo linkage", score: 76, benchmark: 68, meaning: "Brand linkage is strong enough to retain sponsorship value." },
  { signal: "AI PC linkage", score: 61, benchmark: 65, meaning: "Some viewers remember Lenovo, but not specifically AI PC." },
  { signal: "Daily-use clarity", score: 54, benchmark: 66, meaning: "The execution inspires more than it explains a repeatable use case." },
  { signal: "Believability", score: 73, benchmark: 70, meaning: "Real-world performance cues support trust." },
  { signal: "Motivates action", score: 58, benchmark: 62, meaning: "A clearer product proof and price anchor are needed near conversion." },
];

export const mediaPerformance = [
  { channel: "Online video", spend: 31, reach: 68, incrementalIntent: 8.9, efficiency: 118 },
  { channel: "Social short video", spend: 24, reach: 61, incrementalIntent: 7.6, efficiency: 112 },
  { channel: "FIFA live activation", spend: 16, reach: 28, incrementalIntent: 12.4, efficiency: 104 },
  { channel: "Retail / e-commerce", spend: 18, reach: 36, incrementalIntent: 9.7, efficiency: 109 },
  { channel: "Display", spend: 11, reach: 42, incrementalIntent: 2.8, efficiency: 64 },
];

export const evidenceLedger = [
  { claim: "Campaign increased AI PC consideration by 8 points", evidence: "Matched exposed vs control post-test", method: "Doubly robust uplift", uncertainty: "95% CI +4.1 to +11.9", grade: "Causal-ready demo" },
  { claim: "Daily-use clarity is the largest creative bottleneck", evidence: "Creative diagnostics + mediation path", method: "Path model", uncertainty: "Indirect effect explains 41% of gap", grade: "Supported" },
  { claim: "Young professionals are the best scalable audience", evidence: "Audience uplift × reachable population", method: "CATE / uplift model", uncertainty: "Stable in 4/5 folds", grade: "Supported" },
  { claim: "Display budget should be reduced", evidence: "Incremental intent per spend index", method: "Bayesian MMM", uncertainty: "Response curve overlaps at low spend", grade: "Directional" },
  { claim: "Campaign will drive PC sales", evidence: "No matched sales or SKU outcome feed", method: "Not estimable yet", uncertainty: "Requires outcome connection", grade: "Not proven" },
];

export const officialCampaignFacts = [
  { label: "Campaign", value: "Maximum David", detail: "Global launch with David Beckham, 14 May 2026" },
  { label: "Role", value: "Official Technology Partner", detail: "FIFA World Cup 2026 and FIFA Women’s World Cup 2027" },
  { label: "Channels", value: "Film · digital · social · retail · experiential", detail: "Global multi-channel rollout" },
  { label: "Strategic proof", value: "AI in real-world performance", detail: "Work, creativity, sport and fan experience" },
];
