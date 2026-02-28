/**
 * x402 Quickstart — Standalone Compliance Check
 *
 * This example shows how to use Shulam's compliance API directly,
 * without the x402 payment flow. Useful for:
 *   - Pre-screening wallet addresses before transacting
 *   - Checking trust scores for counterparty risk assessment
 *   - Verifying compliance receipts from past transactions
 *
 * Usage:
 *   npx tsx src/compliance.ts
 *   npx tsx src/compliance.ts 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
 */

import "dotenv/config";
import { ComplianceClient } from "@shulam/x402/compliance";

// ─── Configuration ───────────────────────────────────────────────────────────

const facilitatorUrl = process.env.FACILITATOR_URL || "https://api.shulam.io";
const apiKey = process.env.SHULAM_API_KEY;

const compliance = new ComplianceClient({
  facilitatorUrl,
  apiKey,
});

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Use address from CLI arg or default to vitalik.eth
  const address = process.argv[2] || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

  console.log("\n  x402 Compliance Check");
  console.log("  ─────────────────────");
  console.log(`  Facilitator: ${facilitatorUrl}`);
  console.log(`  Address:     ${address}`);
  console.log();

  // 1. Check address compliance status and trust score
  console.log("  1. Checking address compliance...");
  const result = await compliance.checkAddress(address);

  console.log(`     OFAC Status: ${result.status}`);
  console.log(`     Trust Score: ${result.trustScore}`);
  console.log(`     Trust Tier:  ${result.trustTier}`);
  console.log();

  if (result.status === "clear") {
    console.log("     This address is CLEAR for x402 transactions.");
  } else if (result.status === "held") {
    console.log("     This address is HELD — pending compliance review.");
  } else {
    console.log("     This address is BLOCKED — transactions will be rejected.");
  }

  console.log();
  console.log("  Learn more:");
  console.log("    Documentation: https://docs.shulam.io");
  console.log("    Trust API:     GET /v1/trust/:address");
  console.log("    Analytics:     https://shulam.io/analytics");
  console.log();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
