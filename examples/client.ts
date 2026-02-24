/**
 * x402 Quickstart — Client Example
 *
 * An auto-paying HTTP client that handles 402 Payment Required responses
 * transparently. Includes spending limits and compliance receipt tracking.
 *
 * Run: PRIVATE_KEY=0x... npx tsx examples/client.ts
 */

import { createShulamClient, EthersSignerAdapter } from "@shulam/x402/client";
import { Wallet } from "ethers";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://api.shulam.io";
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3000";

if (!PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY environment variable is required.");
  console.error("Usage: PRIVATE_KEY=0x... npx tsx examples/client.ts");
  process.exit(1);
}

// Create a wallet from the private key
const wallet = new Wallet(PRIVATE_KEY);
console.log(`Wallet address: ${wallet.address}`);

// Create the Shulam x402 client
// This wraps fetch() to automatically handle 402 responses:
//   1. Detect 402 Payment Required
//   2. Parse X-Payment-Required header
//   3. Check spending limits
//   4. Sign EIP-3009 authorization
//   5. Retry with X-Payment header
//   6. Parse compliance receipt from response
const client = createShulamClient({
  facilitatorUrl: FACILITATOR_URL,
  signer: new EthersSignerAdapter(wallet),
  walletAddress: wallet.address,
  maxPaymentUSDC: "1.00",   // Max 1 USDC per transaction
  maxDailyUSDC: "10.00",    // Max 10 USDC per day (rolling 24h)
});

async function main() {
  // --- Example 1: Free endpoint (no payment) ---
  console.log("\n--- Example 1: Free endpoint ---");
  const freeResponse = await client.fetch(`${SERVER_URL}/api/health`);
  console.log("Status:", freeResponse.status);
  console.log("Data:", await freeResponse.json());

  // --- Example 2: Paywalled endpoint (auto-payment) ---
  console.log("\n--- Example 2: Paywalled endpoint (0.001 USDC) ---");
  const premiumResponse = await client.fetch(`${SERVER_URL}/api/premium`);
  console.log("Status:", premiumResponse.status);
  console.log("Data:", await premiumResponse.json());

  // Check the compliance receipt
  const receipt = client.getLastReceipt();
  if (receipt) {
    console.log("\nCompliance Receipt:");
    console.log(`  Request ID:   ${receipt.requestId}`);
    console.log(`  Buyer:        ${receipt.buyerAddress}`);
    console.log(`  Merchant:     ${receipt.merchantAddress}`);
    console.log(`  Amount:       ${receipt.amountAtomic} atomic (${Number(receipt.amountAtomic) / 1_000_000} USDC)`);
    console.log(`  Trust Score:  ${receipt.trustScore}/1000`);
    console.log(`  Trust Tier:   ${receipt.trustTier}`);
    console.log(`  OFAC Status:  ${receipt.screening.overallStatus}`);
    console.log(`  Audit Hash:   ${receipt.auditHash}`);
  }

  // --- Check daily spending ---
  console.log("\n--- Daily Spending ---");
  const spending = client.getDailySpending();
  console.log(`  Spent:     ${spending.spentAtomic} atomic`);
  console.log(`  Limit:     ${spending.limitAtomic} atomic`);
  console.log(`  Remaining: ${spending.remaining} atomic`);
}

main().catch(console.error);
