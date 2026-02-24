/**
 * Shulam x402 Payment Example — Express
 *
 * Demonstrates paywalling an API endpoint with USDC payments.
 *
 * Setup:
 *   1. Set SHULAM_API_KEY in your environment
 *   2. Replace "0xYourWallet" with your wallet address
 *   3. Run: npm start
 *   4. Visit: http://localhost:8080
 */

import express from "express";
import { requirePayment } from "@shulam/sdk/express";

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

// ─── Free Endpoints ─────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({
    name: "My API",
    version: "1.0.0",
    endpoints: {
      free: ["GET /", "GET /health"],
      paid: ["GET /premium ($1 USDC)", "GET /data ($0.10 USDC)"],
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Paid Endpoints ─────────────────────────────────────

// $1 USDC per request
app.get(
  "/premium",
  requirePayment({
    amount: "1000000", // 1 USDC
    payTo: "0xYourWallet", // Replace with your wallet
    description: "Premium API access",
  }),
  (req, res) => {
    const payment = (req as express.Request & { payment?: { payer: string; txHash: string } }).payment;
    res.json({
      data: "This is premium content worth paying for.",
      payment: {
        paidBy: payment?.payer,
        txHash: payment?.txHash,
        amount: "1.00 USDC",
      },
    });
  },
);

// $0.10 USDC per request
app.get(
  "/data",
  requirePayment({
    amount: "100000", // 0.10 USDC
    payTo: "0xYourWallet", // Replace with your wallet
    description: "Data endpoint access",
  }),
  (req, res) => {
    const payment = (req as express.Request & { payment?: { payer: string; txHash: string } }).payment;
    res.json({
      data: { temperature: 72, humidity: 45, wind: "NW 12mph" },
      payment: {
        paidBy: payment?.payer,
        txHash: payment?.txHash,
        amount: "0.10 USDC",
      },
    });
  },
);

// ─── Start ──────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log();
  console.log("Endpoints:");
  console.log("  GET /          — free (API info)");
  console.log("  GET /health    — free (health check)");
  console.log("  GET /premium   — $1.00 USDC");
  console.log("  GET /data      — $0.10 USDC");
});
