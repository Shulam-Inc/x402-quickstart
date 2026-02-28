# x402 Quickstart — Shulam

> Get an x402 payment-enabled API running in under 5 minutes.

## What is x402?

x402 is the HTTP 402 "Payment Required" standard, originated by Coinbase, that enables AI agents to pay for API resources in a single HTTP round trip. An agent hits a paywalled endpoint, receives a 402 response with payment requirements, signs a USDC transfer on Base, and resubmits — all without human intervention. Shulam is the compliance-first x402 facilitator: every payment is screened against OFAC sanctions, assigned a trust score, and settled on-chain with a cryptographic compliance receipt.

## Prerequisites

- **Node.js 22+** (LTS recommended)
- **npm 10+**
- **Base Sepolia ETH** for gas — get from the [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- **Base Sepolia USDC** for payments — get from the [Circle Faucet](https://faucet.circle.com/)
- A Shulam API key (sign up at [shulam.io](https://shulam.io))

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/Shulam-Inc/x402-quickstart.git
cd x402-quickstart
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your API key, seller address, and buyer private key
```

### 4. Run the server (paywalled API)

```bash
npx tsx src/server.ts
```

### 5. Run the client (auto-paying agent)

In a second terminal:

```bash
npx tsx src/client.ts
```

### 6. Run a standalone compliance check

```bash
npx tsx src/compliance.ts
```

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   AI Agent   │────▶│  Your API Server │────▶│   Resource   │
│  (client.ts) │     │   (server.ts)    │     │   Response   │
└──────┬───────┘     └────────┬─────────┘     └─────────────┘
       │                      │
       │  1. GET /api/weather  │
       │  ◀── 402 + payment   │
       │       requirements    │
       │                      │
       │  2. Sign USDC auth   │
       │  ──▶ retry with      │
       │       X-Payment      │
       │                      │
       │         ┌────────────┴───────────┐
       │         │   Shulam Facilitator   │
       │         │   api.shulam.io        │
       │         │                        │
       │         │  ┌─────────┐           │
       │         │  │ SAMUEL  │ OFAC      │
       │         │  │ screen  │           │
       │         │  └────┬────┘           │
       │         │  ┌────┴────┐           │
       │         │  │  RUTH   │ Trust     │
       │         │  │  score  │           │
       │         │  └────┬────┘           │
       │         │  ┌────┴────┐           │
       │         │  │  LEVI   │ Settle    │
       │         │  │ on-chain│           │
       │         │  └─────────┘           │
       │         └────────────────────────┘
       │
       │  3. 200 + data + compliance receipt
       ▼
```

## Contract Addresses (Base Sepolia)

| Contract | Address | Basescan |
|----------|---------|----------|
| ShulamIdentityRegistry | `0xeB48884F918dA8E036d1631c2EBf39fA5EBf6557` | [View](https://sepolia.basescan.org/address/0xeB48884F918dA8E036d1631c2EBf39fA5EBf6557) |
| ShulamReputationRegistry | `0xBAC79EC361f57bc9c264f3556D1f371D1Ec1751d` | [View](https://sepolia.basescan.org/address/0xBAC79EC361f57bc9c264f3556D1f371D1Ec1751d) |
| ShulamValidationRegistry | `0x9412847253cEa81Eda9dDfbB8a590844A5b0a4D7` | [View](https://sepolia.basescan.org/address/0x9412847253cEa81Eda9dDfbB8a590844A5b0a4D7) |
| ZKPComplianceVerifier | `0xb7D0cd7117508E25D4b2d8F9B9C8D95B29A7bab4` | [View](https://sepolia.basescan.org/address/0xb7D0cd7117508E25D4b2d8F9B9C8D95B29A7bab4) |
| Groth16Verifier | `0xF15677E2b60843eb8ca09E973b66C8E9E3087fd4` | [View](https://sepolia.basescan.org/address/0xF15677E2b60843eb8ca09E973b66C8E9E3087fd4) |
| ShulamEscrow | `0x424f1bd78f743CB96f24D7cb5cAAa9E93b75dE16` | [View](https://sepolia.basescan.org/address/0x424f1bd78f743CB96f24D7cb5cAAa9E93b75dE16) |
| CashbackVault | `0x2172ef9DBfeCFAd451BC81FcE017EB3872699c45` | [View](https://sepolia.basescan.org/address/0x2172ef9DBfeCFAd451BC81FcE017EB3872699c45) |

## Examples

| File | Description |
|------|-------------|
| `src/server.ts` | Express server with 2 paywalled endpoints and 1 free health endpoint |
| `src/client.ts` | Auto-paying HTTP client with spending limits ($1/tx, $10/day) |
| `src/compliance.ts` | Standalone OFAC screening and trust score lookup |

## Links

- **API:** [api.shulam.io](https://api.shulam.io)
- **Documentation:** [docs.shulam.io](https://docs.shulam.io)
- **Analytics:** [shulam.io/analytics](https://shulam.io/analytics)
- **ERC-8004 Scan:** [shulam.io/scan](https://shulam.io/scan)
- **Token Spec (TOKEN-001 v6.1):** [docs.shulam.io/token-001](https://docs.shulam.io/token-001)
- **White Paper:** [docs.shulam.io/whitepaper](https://docs.shulam.io/whitepaper)
- **npm:** [@shulam/x402](https://www.npmjs.com/package/@shulam/x402)

## License

MIT — see [LICENSE](./LICENSE)
