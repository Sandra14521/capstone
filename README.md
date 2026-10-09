# Usage Metering & Billing Engine

A backend capstone demonstrating SaaS usage tracking, subscription
quotas, cost calculation, and Stripe subscription integration.

## Features

- Monthly API-call and AI-token usage metering
- Idempotency-key based duplicate prevention
- Free and Pro subscription plans
- Quota enforcement and usage reports
- Integer based cost accounting
- Stripe Checkout and webhook processing
- Subscription reconciliation job

## Technology

- Node.js and Express
- PostgreSQL
- Docker Compose
- Stripe test mode
- Node.js built in test runner

## Setup

1. Install Node.js and Docker Desktop.
2. Copy `.env.example` to `.env`.
3. Configure the local PostgreSQL connection.
4. Start PostgreSQL with `docker compose up -d`.
5. Run `npm install`.
6. Run `npm run migrate`.
7. Run `npm run seed`.
8. Start the API with `npm start`.
9. Run tests with `npm test`.

## API

- GET /health
- POST /generate
- GET /usage
- POST /billing/checkout
- POST /webhooks/stripe

## Security

The tenant header is a development only mechanism, not authentication.
Never commit `.env` or Stripe secrets. Use Stripe test mode only.

## Limitations

This project is a learning capstone. Do not use it for real billing
without production authentication, authorization, monitoring, and
additional correctness and security testing.

## Verification

See EVIDENCE.md for the current verification status.
