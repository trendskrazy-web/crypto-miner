# trendskrazy-web (Crypto Miner) — Dockerized MVP

This repository is the Dockerized MVP for **Crypto Miner**: a marketplace for hiring mining contracts
with a payout engine that simulates BTC accrual using on-chain hashprice.

## Quick start (development)

1. Copy `.env.example` to `.env` and edit values (no real secrets included).
2. Build and run with Docker Compose:
   ```
   docker compose up --build
   ```
3. Initialize DB migrations and seed sample machines (run once):
   ```
   docker compose exec backend npx prisma migrate deploy
   docker compose exec backend node prisma/seed.js
   ```
4. Frontend: http://localhost:5173
   Backend API: http://localhost:4000
   Payout worker runs as a separate service and schedules daily accrual jobs.

## Notes
- This MVP uses simulated balances only. No on-chain payouts are performed.
- Do not accept real user funds until you've implemented KYC, custody, and legal checks.
- Stripe & Coinbase Commerce test integrations are included; add test keys in `.env`.

## Next steps
- Integrate Onfido/Jumio for KYC gating.
- Add admin UI for payout approvals.
- Integrate a custodial provider if you want to do real BTC transfers.
