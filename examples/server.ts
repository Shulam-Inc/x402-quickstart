/**
 * x402 Quickstart — Server Example
 *
 * An Express server with paywalled endpoints using Shulam's x402 compliance middleware.
 * Every paid request is OFAC-screened, trust-scored, and settled in USDC on Base.
 *
 * Run: SELLER_ADDRESS=0x... npx tsx examples/server.ts
 */

import express from "express";
import { createShulamServer } from "@shulam/x402/server";

const app = express();

const SELLER_ADDRESS = process.env.SELLER_ADDRESS;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://api.shulam.io";
const NETWORK = process.env.NETWORK ?? "base-sepolia";

if (!SELLER_ADDRESS) {
  console.error("Error: SELLER_ADDRESS environment variable is required.");
  console.error("Usage: SELLER_ADDRESS=0x... npx tsx examples/server.ts");
  process.exit(1);
}

// Create the x402 paywall middleware
// This intercepts requests to configured endpoints and handles the full
// 402 Payment Required → EIP-3009 signing → OFAC screening → settlement flow.
const paywall = createShulamServer({
  facilitatorUrl: FACILITATOR_URL,
  sellerAddress: SELLER_ADDRESS,
  endpoints: {
    // Paywall this endpoint at 0.001 USDC per request
    "GET /api/premium": {
      price: "0.001",
      network: NETWORK,
      description: "Premium API access — compliance data included",
    },

    // Higher price + trust tier requirement
    "GET /api/enterprise": {
      price: "0.01",
      network: NETWORK,
      minimumTrustTier: "standard",
      description: "Enterprise-grade compliance report",
    },

    // Per-request pricing for data export
    "POST /api/export": {
      price: "0.05",
      network: NETWORK,
      description: "Data export",
    },
  },
});

// Mount the middleware — it only intercepts routes in the config above
app.use(paywall);

// --- Routes ---

// Free endpoint — no payment required
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    facilitator: FACILITATOR_URL,
    network: NETWORK,
    seller: SELLER_ADDRESS,
  });
});

// Paywalled endpoint — 0.001 USDC
app.get("/api/premium", (req, res) => {
  // req.payment is populated by the middleware after successful settlement
  const payment = req.payment;

  res.json({
    data: "premium compliance data",
    payment: payment
      ? {
          payer: payment.payer,
          txHash: payment.txHash,
          settled: payment.settled,
          trustTier: payment.receipt?.trustTier,
          trustScore: payment.receipt?.trustScore,
          complianceStatus: payment.receipt?.screening?.overallStatus,
          auditHash: payment.receipt?.auditHash,
        }
      : null,
  });
});

// Enterprise endpoint — 0.01 USDC + minimum "standard" trust tier
app.get("/api/enterprise", (req, res) => {
  res.json({
    data: "enterprise compliance report",
    report: {
      ofacScreening: "clear",
      trustScore: req.payment?.receipt?.trustScore,
      trustTier: req.payment?.receipt?.trustTier,
      auditTrail: req.payment?.receipt?.auditHash,
    },
  });
});

// Export endpoint — 0.05 USDC
app.post("/api/export", (req, res) => {
  res.json({
    data: "exported dataset",
    format: "json",
    payer: req.payment?.payer,
  });
});

// Start server
const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`x402 Quickstart Server running on http://localhost:${PORT}`);
  console.log("");
  console.log("Endpoints:");
  console.log(`  GET  /api/health      — free (health check)`);
  console.log(`  GET  /api/premium     — 0.001 USDC (x402 paywalled)`);
  console.log(`  GET  /api/enterprise  — 0.01 USDC + standard trust tier`);
  console.log(`  POST /api/export      — 0.05 USDC`);
  console.log("");
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log(`Network:     ${NETWORK}`);
  console.log(`Seller:      ${SELLER_ADDRESS}`);
});
