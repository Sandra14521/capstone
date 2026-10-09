# Capstone Evidence

Evidence status: Pending end to end verification.

## 1. Idempotent metering

Status: Pending.
Required proof: Send the same billable request twice with the same
tenant and idempotency key. Show that only two usage events exist
for that request: one API-call event and one AI-token event.

## 2. Quota enforcement

Status: Pending.
Required proof: Demonstrate the documented exact boundary behavior
and a request that exceeds the quota. Capture the HTTP response.

## 3. Cost calculation

Status: Unit tests written; execution pending.
Required proof: Show test output for cached input, ordinary input,
output tokens, and reasoning tokens.

## 4. Stripe Checkout

Status: Pending.
Required proof: Complete a test Checkout and show the tenant's plan
changing from Free to Pro after webhook processing.

## 5. Webhook verification and deduplication

Status: Pending.
Required proof: Show a forged webhook receiving HTTP 400 and a
replayed valid event being processed only once.

## 6. Database and tenant isolation

Status: Pending.
Required proof: Show migrations, tenant-scoped queries, and tests
that prevent access to another tenant's usage.
