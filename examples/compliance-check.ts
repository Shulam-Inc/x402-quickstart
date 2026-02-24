/**
 * x402 Quickstart — Standalone Compliance Check
 *
 * Use Shulam's compliance API directly to screen an address
 * against OFAC sanctions lists and retrieve its trust score.
 *
 * Run: npx tsx examples/compliance-check.ts
 */

const FACILITATOR_URL = process.env.FACILITATOR_URL ?? "https://api.shulam.io";

// Address to screen (use a known-safe testnet address)
const ADDRESS_TO_CHECK = process.env.ADDRESS ?? "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD28";

async function screenAddress(address: string) {
  console.log(`Screening address: ${address}`);
  console.log(`Facilitator: ${FACILITATOR_URL}`);
  console.log("");

  // --- 1. OFAC Compliance Screening ---
  console.log("--- OFAC Screening ---");
  const screenResponse = await fetch(`${FACILITATOR_URL}/api/v1/compliance/screen`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });

  if (screenResponse.ok) {
    const screenResult = await screenResponse.json();
    console.log(`  Status:     ${screenResult.status}`);
    console.log(`  Screened:   ${screenResult.screened ? "Yes" : "No"}`);
    console.log(`  Timestamp:  ${screenResult.timestamp}`);
  } else {
    console.log(`  Error: ${screenResponse.status} ${screenResponse.statusText}`);
  }

  // --- 2. Trust Score Lookup ---
  console.log("\n--- Trust Score ---");
  const trustResponse = await fetch(`${FACILITATOR_URL}/v1/trust/${address}`);

  if (trustResponse.ok) {
    const trustResult = await trustResponse.json();
    console.log(`  Score:      ${trustResult.trustScore}/1000`);
    console.log(`  Tier:       ${trustResult.trustTier}`);
    console.log(`  Components: ${JSON.stringify(trustResult.components ?? {})}`);
  } else {
    console.log(`  Error: ${trustResponse.status} ${trustResponse.statusText}`);
    console.log(`  (New addresses start with no trust score — transact to build one)`);
  }

  // --- 3. Agent Identity (ERC-8004) ---
  console.log("\n--- ERC-8004 Agent Identity ---");
  const identityResponse = await fetch(
    `${FACILITATOR_URL}/api/v1/scan/agents/84532/${address}`
  );

  if (identityResponse.ok) {
    const identity = await identityResponse.json();
    console.log(`  Registered: Yes`);
    console.log(`  Agent ID:   ${identity.agentId}`);
    console.log(`  Name:       ${identity.name}`);
    console.log(`  Tier:       ${identity.verificationTier}`);
  } else if (identityResponse.status === 404) {
    console.log(`  Registered: No (address not registered as an ERC-8004 agent)`);
    console.log(`  Register at: shulam.io/marketplace`);
  } else {
    console.log(`  Error: ${identityResponse.status} ${identityResponse.statusText}`);
  }
}

screenAddress(ADDRESS_TO_CHECK).catch(console.error);
