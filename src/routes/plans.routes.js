import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, api_call_limit, token_limit,
             monthly_price_cents
      FROM plans
      ORDER BY monthly_price_cents ASC
    `);

    res.json({ plans: result.rows });
  } catch {
    res.status(500).json({ error: 'Unable to retrieve plans.' });
  }
});

export default router;