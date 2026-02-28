/**
 * x402 Quickstart — Paywalled Express Server
 *
 * This server demonstrates how to paywall API endpoints using @shulam/x402.
 * Two endpoints require payment ($0.001 and $0.01), one is free.
 *
 * Usage:
 *   npx tsx src/server.ts
 *
 * Then test with:
 *   curl http://localhost:3000/api/health          # Free — returns 200
 *   curl http://localhost:3000/api/weather          # Paywalled — returns 402
 *   curl http://localhost:3000/api/analysis         # Paywalled — returns 402
 */

import "dotenv/config";
import express from "express";
import { createShulamServer } from "@shulam/x402/server";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ─── x402 Payment Middleware ─────────────────────────────────────────────────
// createShulamServer() returns Express middleware that intercepts requests
// to paywalled endpoints. If no valid payment is attached, it returns
// HTTP 402 with payment requirements. If payment is valid, it verifies
// and settles via the Shulam facilitator, then passes through to your handler.

const x402 = createShulamServer({
  facilitatorUrl: process.env.FACILITATOR_URL || "https://api.shulam.io",
  sellerAddress: process.env.SELLER_ADDRESS || "0x0000000000000000000000000000000000000000",
  apiKey: process.env.SHULAM_API_KEY,
  endpoints: {
    // $0.001 per request — weather data
    "GET /api/weather": {
      price: "0.001",
    },
    // $0.01 per request — premium analysis
    "GET /api/analysis": {
      price: "0.01",
    },
  },
});

app.use(x402);

// ─── Free Endpoint ───────────────────────────────────────────────────────────

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "x402-quickstart",
    timestamp: new Date().toISOString(),
    note: "This endpoint is free — no payment required.",
  });
});

// ─── Paywalled Endpoints ─────────────────────────────────────────────────────

app.get("/api/weather", (req, res) => {
  // If we reach this handler, the payment was verified and settled.
  // The compliance receipt is available on req.payment.
  const payment = (req as Record<string, unknown>).payment as {
    receipt?: { requestId: string; trustScore?: number; trustTier?: string };
    txHash?: string;
    payer?: string;
  } | undefined;

  res.json({
    data: {
      location: "San Francisco, CA",
      temperature: "62°F",
      conditions: "Partly cloudy",
      humidity: "58%",
      wind: "12 mph W",
    },
    compliance: {
      receipt: payment?.receipt?.requestId ?? null,
      trustScore: payment?.receipt?.trustScore ?? null,
      trustTier: payment?.receipt?.trustTier ?? null,
      txHash: payment?.txHash ?? null,
      payer: payment?.payer ?? null,
    },
  });
});

app.get("/api/analysis", (req, res) => {
  const payment = (req as Record<string, unknown>).payment as {
    receipt?: { requestId: string; trustScore?: number; trustTier?: string };
    txHash?: string;
    payer?: string;
  } | undefined;

  res.json({
    data: {
      report: "Premium market analysis for Q1 2026",
      sentiment: "bullish",
      confidence: 0.87,
      sectors: ["AI Infrastructure", "Agent Commerce", "DeFi"],
      recommendation: "Strong Buy — agent commerce TAM expanding 340% YoY",
    },
    compliance: {
      receipt: payment?.receipt?.requestId ?? null,
      trustScore: payment?.receipt?.trustScore ?? null,
      trustTier: payment?.receipt?.trustTier ?? null,
      txHash: payment?.txHash ?? null,
      payer: payment?.payer ?? null,
    },
  });
});

// ─── Start Server ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  x402 Quickstart Server`);
  console.log(`  ──────────────────────`);
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log(`  Facilitator: ${process.env.FACILITATOR_URL || "https://api.shulam.io"}`);
  console.log(`  Seller:      ${process.env.SELLER_ADDRESS || "(not configured)"}`);
  console.log(`\n  Endpoints:`);
  console.log(`    GET /api/health     — free`);
  console.log(`    GET /api/weather    — $0.001 USDC`);
  console.log(`    GET /api/analysis   — $0.01  USDC`);
  console.log();
});
