import { Router } from 'express';
import { pool } from '../db/pool.js';
import { stripe } from '../services/stripe.service.js';

const router = Router();

const allowedStatuses = new Set([
  'active', 'trialing', 'past_due',
  'canceled', 'incomplete', 'unpaid',
]);

router.post(
  '/',
  async (req, res) => {
    let event;

    try {
      const signature = req.get('stripe-signature');

      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch {
      return res.status(400).json({
        error: 'Invalid Stripe webhook signature.',
      });
    }

    let tenantId;
    let customerId;
    let subscriptionId;
    let planId = 'free';
    let status = 'incomplete';

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        if (session.mode !== 'subscription' || !session.subscription) {
          return res.status(400).json({
            error: 'Expected a subscription Checkout session.',
          });
        }

        tenantId = session.metadata?.tenantId
          ?? session.client_reference_id;
        customerId = typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;
        subscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription.id;

        // Stripe is the source of truth for subscription status.
        const subscription = await stripe.subscriptions.retrieve(
          subscriptionId
        );

        tenantId = subscription.metadata?.tenantId ?? tenantId;
        status = allowedStatuses.has(subscription.status)
          ? subscription.status
          : 'incomplete';

        if (status === 'active' || status === 'trialing') {
          planId = 'pro';
        }
      } else if (
        event.type === 'customer.subscription.updated' ||
        event.type === 'customer.subscription.deleted'
      ) {
        const subscription = event.data.object;

        tenantId = subscription.metadata?.tenantId;
        customerId = typeof subscription.customer === 'string'
          ? subscription.customer
          : subscription.customer?.id;
        subscriptionId = subscription.id;

        status = event.type === 'customer.subscription.deleted'
          ? 'canceled'
          : (allowedStatuses.has(subscription.status)
              ? subscription.status
              : 'incomplete');

        if (status === 'active' || status === 'trialing') {
          planId = 'pro';
        }
      } else {
        // Other event types are acknowledged but do not change plans.
        return res.json({ received: true, ignored: true });
      }

      if (!tenantId || !subscriptionId) {
        return res.status(400).json({
          error: 'Webhook is missing tenant or subscription metadata.',
        });
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const inserted = await client.query(
          `INSERT INTO processed_webhook_events
             (event_id, event_type)
           VALUES ($1, $2)
           ON CONFLICT (event_id) DO NOTHING
           RETURNING event_id`,
          [event.id, event.type]
        );

        if (inserted.rowCount === 0) {
          await client.query('COMMIT');
          return res.json({ received: true, duplicate: true });
        }

        const updated = await client.query(
          `UPDATE subscriptions
           SET plan_id = $1,
               status = $2,
               stripe_customer_id =
                 COALESCE($3, stripe_customer_id),
               stripe_subscription_id = $4,
               updated_at = NOW()
           WHERE tenant_id = $5
           RETURNING tenant_id`,
          [planId, status, customerId, subscriptionId, tenantId]
        );

        if (updated.rowCount === 0) {
          throw new Error('Tenant subscription not found.');
        }

        await client.query('COMMIT');

        return res.json({
          received: true,
          processed: true,
          plan: planId,
          status,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Webhook processing failed:', error.message);
      return res.status(500).json({
        error: 'Webhook processing failed; retry delivery.',
      });
    }
  }
);

export default router;