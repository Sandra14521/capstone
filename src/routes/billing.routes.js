import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireTenant } from '../middleware/tenant.middleware.js';
import { createCheckoutSession } from '../services/stripe.service.js';

const router = Router();

router.post('/checkout', requireTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.plan_id, s.status, s.stripe_customer_id
       FROM subscriptions s
       WHERE s.tenant_id = $1`,
      [req.tenantId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        error: 'Tenant subscription not found.',
      });
    }

    if (result.rows[0].plan_id === 'pro' &&
        result.rows[0].status === 'active') {
      return res.status(409).json({
        error: 'Tenant already has an active Pro subscription.',
      });
    }

    const session = await createCheckoutSession({
      tenantId: req.tenantId,
      customerId: result.rows[0].stripe_customer_id,
    });

    res.status(200).json({
      checkoutUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Checkout creation failed:', error.message);
    res.status(500).json({
      error: 'Unable to create Checkout session.',
    });
  }
});

export default router;