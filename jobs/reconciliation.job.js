import 'dotenv/config';
import { pool } from '../db/pool.js';
import { stripe } from '../services/stripe.service.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function retry(operation, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw lastError;
}

export async function reconcileSubscriptions() {
  const result = await pool.query(`
    SELECT tenant_id, plan_id, status, stripe_subscription_id
    FROM subscriptions
    WHERE stripe_subscription_id IS NOT NULL
  `);

  let checked = 0;
  let corrected = 0;

  for (const row of result.rows) {
    try {
      const remote = await retry(() =>
        stripe.subscriptions.retrieve(row.stripe_subscription_id)
      );

      const active = ['active', 'trialing'].includes(remote.status);
      const expectedPlan = active ? 'pro' : 'free';

      if (row.status !== remote.status || row.plan_id !== expectedPlan) {
        await pool.query(
          `UPDATE subscriptions
           SET status = $1, plan_id = $2, updated_at = NOW()
           WHERE tenant_id = $3
             AND stripe_subscription_id = $4`,
          [
            remote.status,
            expectedPlan,
            row.tenant_id,
            row.stripe_subscription_id,
          ]
        );

        corrected++;
      }

      checked++;
    } catch (error) {
      console.error(
        'Subscription reconciliation failed:',
        row.tenant_id,
        error.message
      );
    }
  }

  console.log({ job: 'subscription-reconciliation', checked, corrected });
}

export function startReconciliationJob() {
  // Run once after startup, then every six hours.
  void reconcileSubscriptions().catch((error) => {
    console.error('Reconciliation job failed:', error.message);
  });

  const timer = setInterval(() => {
    void reconcileSubscriptions().catch((error) => {
      console.error('Reconciliation job failed:', error.message);
    });
  }, 6 * 60 * 60 * 1000);

  timer.unref();
}