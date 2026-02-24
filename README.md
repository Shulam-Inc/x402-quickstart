# Express x402 Payment Example

A minimal Express server with two paid endpoints and two free endpoints.

## Setup

```bash
# Install dependencies
npm install

# Set your API key
export SHULAM_API_KEY=sk_test_your_key_here

# Start the server
npm start
```

## Endpoints

| Route | Price | Description |
|-------|-------|-------------|
| `GET /` | Free | API info |
| `GET /health` | Free | Health check |
| `GET /premium` | 1.00 USDC | Premium content |
| `GET /data` | 0.10 USDC | Data endpoint |

## Test

```bash
# Free endpoint
curl http://localhost:8080/

# Paid endpoint (returns 402 with payment requirements)
curl -v http://localhost:8080/premium
```

## How It Works

1. Edit `server.ts` and replace `0xYourWallet` with your wallet address
2. The `requirePayment()` middleware handles the entire x402 flow
3. Clients without payment get a `402 Payment Required` response
4. Clients with a valid `X-Payment` header get their payment verified and settled
5. Your handler receives `req.payment` with `payer` and `txHash`
