import { simulateMarket } from "../../models/consumerModels";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const price = Number(url.searchParams.get("price") || 6999);
  const requestedTarget = url.searchParams.get("target") || "Young Professionals";
  const target = ["Young Professionals", "Students", "Creators"].includes(requestedTarget)
    ? (requestedTarget as "Young Professionals" | "Students" | "Creators")
    : "Young Professionals";

  return Response.json({
    mode: "synthetic-demo",
    generatedAt: new Date().toISOString(),
    filters: { market: url.searchParams.get("market") || "China", price, target },
    prediction: simulateMarket({
      price,
      target,
      aiAssistant: url.searchParams.get("assistant") !== "off",
      battery: url.searchParams.get("battery") !== "off",
      localAi: url.searchParams.get("localAi") === "on",
      trustMessage: url.searchParams.get("trust") === "on",
    }),
    provenance: {
      source: "Synthetic consumer panel v0.6",
      model: "Scenario elasticity demo",
      caveat: "Not calibrated to Lenovo sales or market-share outcomes.",
    },
  });
}
