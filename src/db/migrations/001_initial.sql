CREATE TABLE plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_call_limit BIGINT NOT NULL CHECK (api_call_limit >= 0),
    token_limit BIGINT NOT NULL CHECK (token_limit >= 0),
    monthly_price_cents BIGINT NOT NULL CHECK (monthly_price_cents >= 0),
    stripe_price_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id),
    plan_id TEXT NOT NULL REFERENCES plans(id),
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN (
            'active', 'trialing', 'past_due',
            'canceled', 'incomplete', 'unpaid'
        )),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    usage_type TEXT NOT NULL
        CHECK (usage_type IN ('api_call', 'ai_tokens')),
    quantity BIGINT NOT NULL CHECK (quantity > 0),
    cost_micro_units BIGINT NOT NULL DEFAULT 0
        CHECK (cost_micro_units >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, idempotency_key)
);

CREATE INDEX idx_usage_tenant_created
    ON usage_events (tenant_id, created_at);

CREATE TABLE processed_webhook_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO plans (
    id, name, api_call_limit, token_limit, monthly_price_cents
) VALUES
    ('free', 'Free', 1000, 100000, 0),
    ('pro', 'Pro', 100000, 10000000, 1000);