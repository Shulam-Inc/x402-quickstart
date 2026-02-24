# x402-quickstart

> Get started with x402 compliant payments on Base in under 10 minutes.

**Shulam** is the compliance layer for AI agent payments on Base. This quickstart shows you how to:

1. **Paywall an Express endpoint** with automatic OFAC screening and trust scoring
2. **Make auto-paying HTTP requests** that handle 402 Payment Required transparently
3. **Verify compliance receipts** for audit trails

All transactions settle in USDC on Base via the [x402 protocol](https://www.x402.org/) (Coinbase's HTTP 402 payment standard).

## Prerequisites

- Node.js 22+
- An Ethereum wallet with Base Sepolia USDC ([faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet))
- A Shulam API key (free tier: 100 screenings/day) — get one at [shulam.io](https://shulam.io)

## Quick Start

### 1. Install

```bash
npm install @shulam/x402 express
```

### 2. Server — Paywall an endpoint (3 lines of setup)

```typescript
// server.ts
import express from "express";
import { createShulamServer } from "@shulam/x402/server";

const app = express();

// 1. Create the paywall middleware
const paywall = createShulamServer({
  facilitatorUrl: "https://api.shulam.io",
  sellerAddress: process.env.SELLER_ADDRESS!,
  endpoints: {
    "GET /api/premium": {
      price: "0.001",          // 0.001 USDC per request
      network: "base-sepolia",
      description: "Premium API access",
    },
  },
});

// 2. Mount it
app.use(paywall);

// 3. Your route works as normal — payments are handled automatically
app.get("/api/premium", (req, res) => {
  // req.payment contains the compliance receipt, tx hash, and payer address
  res.json({
    data: "premium content",
    payer: req.payment?.payer,
    trustTier: req.payment?.receipt?.trustTier,
    txHash: req.payment?.txHash,
  });
});

app.get("/api/free", (_req, res) => {
  res.json({ data: "free content — no payment required" });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
  console.log("  GET /api/free     — no payment");
  console.log("  GET /api/premium  — requires 0.001 USDC via x402");
});
```

### 3. Client — Auto-pay on 402

```typescript
// client.ts
import { createShulamClient, EthersSignerAdapter } from "@shulam/x402/client";
import { Wallet } from "ethers";

const wallet = new Wallet(process.env.PRIVATE_KEY!);

const client = createShulamClient({
  facilitatorUrl: "https://api.shulam.io",
  signer: new EthersSignerAdapter(wallet),
  walletAddress: wallet.address,
  maxPaymentUSDC: "1.00",    // Per-transaction limit
  maxDailyUSDC: "10.00",     // Daily spending cap
});

// fetch() works like normal — 402 responses are handled automatically
const response = await client.fetch("http://localhost:3000/api/premium");
const data = await response.json();

console.log("Response:", data);
console.log("Receipt:", client.getLastReceipt());
console.log("Daily spending:", client.getDailySpending());
```

### 4. Run it

```bash
# Terminal 1 — start the server
SELLER_ADDRESS=0xYourAddress npx tsx server.ts

# Terminal 2 — run the client
PRIVATE_KEY=0xYourPrivateKey npx tsx client.ts
```

## What happens under the hood

```
Client                    Server                   Shulam (api.shulam.io)
  |                         |                              |
  |-- GET /api/premium ---->|                              |
  |                         |--- No payment header ------->|
  |<-- 402 Payment Required |                              |
  |   (X-Payment-Required)  |                              |
  |                         |                              |
  |-- Sign EIP-3009 ------->|                              |
  |-- GET /api/premium ---->|                              |
  |   (X-Payment header)    |--- Verify + OFAC screen --->|
  |                         |<-- Compliance receipt -------|
  |                         |--- Settle on Base ---------> |  (on-chain USDC transfer)
  |<-- 200 OK + data -------|                              |
  |   (X-Shulam-Compliance- |                              |
  |    Receipt header)       |                              |
```

Every request through Shulam is:
- **OFAC screened** against the SDN sanctions list
- **Trust scored** with a multi-signal scoring model (0-1000)
- **Settled on-chain** via USDC on Base (EIP-3009 transferWithAuthorization)
- **Audit-trailed** with a SHA-256 compliance receipt

## Examples

| Example | Description |
|---------|-------------|
| [`examples/server.ts`](examples/server.ts) | Express server with paywalled + free endpoints |
| [`examples/client.ts`](examples/client.ts) | Auto-paying client with spending limits |
| [`examples/compliance-check.ts`](examples/compliance-check.ts) | Standalone compliance screening |

## Configuration

### Environment Variables

```bash
# .env
SELLER_ADDRESS=0x...           # Your wallet address (receives settlement)
PRIVATE_KEY=0x...              # Client wallet private key (for signing)
FACILITATOR_URL=https://api.shulam.io  # Shulam facilitator (default)
```

### Trust Tiers

Shulam assigns every transacting address a trust tier:

| Tier | Score Range | Description |
|------|------------|-------------|
| `starter` | 0-249 | New or unverified agent |
| `standard` | 250-499 | Basic compliance history |
| `premium` | 500-749 | Strong compliance record |
| `enterprise` | 750-1000 | Highest trust level |

You can require a minimum trust tier per endpoint:

```typescript
endpoints: {
  "GET /api/premium": {
    price: "0.001",
    minimumTrustTier: "standard",  // Reject agents below "standard"
  },
}
```

### Pricing Strategies

```typescript
import { PricingEngine } from "@shulam/x402/pricing";

// Fixed price
PricingEngine.fixed("0.001");           // 0.001 USDC

// Per-unit (e.g., per API token)
PricingEngine.perUnit("0.0001", 500);   // 500 tokens @ 0.0001 USDC each

// Compute-time (e.g., per second of GPU)
PricingEngine.computeTime("0.001", 60, 3600);  // $0.001/sec, 60s used, 1h max

// Tiered
PricingEngine.tiered([
  { maxUnits: 100, priceUSDC: "0.01" },
  { maxUnits: 1000, priceUSDC: "0.005" },
  { maxUnits: Infinity, priceUSDC: "0.001" },
], 500);
```

## Smart Contracts on Base Sepolia

| Contract | Address |
|----------|---------|
| ShulamIdentityRegistry | [`0xeB48884F918dA8E036d1631c2EBf39fA5EBf6557`](https://sepolia.basescan.org/address/0xeB48884F918dA8E036d1631c2EBf39fA5EBf6557) |
| ShulamReputationRegistry | [`0xBAC79EC361f57bc9c264f3556D1f371D1Ec1751d`](https://sepolia.basescan.org/address/0xBAC79EC361f57bc9c264f3556D1f371D1Ec1751d) |
| ShulamValidationRegistry | [`0x9412847253cEa81Eda9dDfbB8a590844A5b0a4D7`](https://sepolia.basescan.org/address/0x9412847253cEa81Eda9dDfbB8a590844A5b0a4D7) |
| ZKPComplianceVerifier | [`0xb7D0cd7117508E25D4b2d8F9B9C8D95B29A7bab4`](https://sepolia.basescan.org/address/0xb7D0cd7117508E25D4b2d8F9B9C8D95B29A7bab4) |
| Groth16Verifier | [`0xF15677E2b60843eb8ca09E973b66C8E9E3087fd4`](https://sepolia.basescan.org/address/0xF15677E2b60843eb8ca09E973b66C8E9E3087fd4) |

## Links

- **API:** [api.shulam.io](https://api.shulam.io)
- **Docs:** [docs.shulam.io](https://docs.shulam.io)
- **Analytics:** [shulam.io/analytics](https://shulam.io/analytics)
- **Marketplace:** [shulam.io/marketplace](https://shulam.io/marketplace)
- **ERC-8004 Scan:** [shulam.io/scan](https://shulam.io/scan)
- **x402 Protocol:** [x402.org](https://www.x402.org/)

## License

MIT
