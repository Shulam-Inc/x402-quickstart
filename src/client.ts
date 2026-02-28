/**
 * x402 Quickstart — Auto-Paying Client
 *
 * This client demonstrates how an AI agent automatically pays for
 * paywalled API endpoints using @shulam/x402.
 *
 * It handles the full 402 flow transparently:
 *   1. Sends a request to a paywalled endpoint
 *   2. Receives 402 Payment Required
 *   3. Signs USDC authorization via EIP-3009
 *   4. Retries with payment proof
 *   5. Receives the response + compliance receipt
 *
 * Usage:
 *   npx tsx src/client.ts
 *
 * Make sure the server is running first:
 *   npx tsx src/server.ts
 */

import "dotenv/config";
import { createShulamClient, ViemSignerAdapter } from "@shulam/x402/client";
import { createWalletClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

// ─── Configuration ───────────────────────────────────────────────────────────

const BUYER_PRIVATE_KEY = process.env.BUYER_PRIVATE_KEY;
if (!BUYER_PRIVATE_KEY) {
  console.error("Error: BUYER_PRIVATE_KEY is required in .env");
  process.exit(1);
}

const account = privateKeyToAccount(BUYER_PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: baseSepolia,
  transport: http(),
});

// ─── Create Shulam Client ────────────────────────────────────────────────────
// The client wraps fetch() and automatically handles 402 responses.
// When it encounters a paywall, it signs a USDC transfer authorization
// and retries the request with payment proof.

const client = createShulamClient({
  facilitatorUrl: process.env.FACILITATOR_URL || "https://api.shulam.io",
  signer: new ViemSignerAdapter(walletClient),
  walletAddress: account.address,
  apiKey: process.env.SHULAM_API_KEY,

  // Spending limits protect against unexpected charges
  maxPaymentUSDC: "1",     // Max $1 per transaction
  maxDailyUSDC: "10",      // Max $10 per day
});

const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000";

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("\n  x402 Quickstart Client");
  console.log("  ──────────────────────");
  console.log(`  Wallet:  ${account.address}`);
  console.log(`  Server:  ${SERVER_URL}`);
  console.log();

  // 1. Free endpoint — no payment needed
  console.log("  1. Fetching /api/health (free)...");
  const healthRes = await client.fetch(`${SERVER_URL}/api/health`);
  const health = await healthRes.json();
  console.log(`     Status: ${healthRes.status}`);
  console.log(`     Response: ${JSON.stringify(health, null, 2)}`);
  console.log();

  // 2. Paywalled endpoint — $0.001
  console.log("  2. Fetching /api/weather ($0.001 USDC)...");
  const weatherRes = await client.fetch(`${SERVER_URL}/api/weather`);
  const weather = await weatherRes.json();
  console.log(`     Status: ${weatherRes.status}`);
  console.log(`     Response: ${JSON.stringify(weather, null, 2)}`);

  // Print compliance receipt from the response
  const receipt = client.getLastReceipt();
  if (receipt) {
    console.log(`     Compliance Receipt:`);
    console.log(`       Request ID:  ${receipt.requestId}`);
    console.log(`       Trust Score: ${receipt.trustScore}`);
    console.log(`       Trust Tier:  ${receipt.trustTier}`);
  }
  console.log();

  // 3. Premium paywalled endpoint — $0.01
  console.log("  3. Fetching /api/analysis ($0.01 USDC)...");
  const analysisRes = await client.fetch(`${SERVER_URL}/api/analysis`);
  const analysis = await analysisRes.json();
  console.log(`     Status: ${analysisRes.status}`);
  console.log(`     Response: ${JSON.stringify(analysis, null, 2)}`);
  console.log();

  // 4. Show daily spending summary
  const spending = client.getDailySpending();
  console.log("  Daily Spending Summary:");
  console.log(`    Spent:     ${spending.spentAtomic} atomic USDC`);
  console.log(`    Limit:     ${spending.limitAtomic} atomic USDC`);
  console.log(`    Remaining: ${spending.remaining} atomic USDC`);
  console.log();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
