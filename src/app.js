import express from 'express';
import healthRoutes from './routes/health.routes.js';
import usageRoutes from './routes/usage.routes.js';
import billingRoutes from './routes/billing.routes.js';
import plansRoutes from './routes/plans.routes.js';
import stripeWebhookRoutes from './routes/stripe-webhook.routes.js';

const app = express();

app.disable('x-powered-by');

// Must be registered before express.json().
app.use(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookRoutes
);

app.use(express.json({ limit: '32kb' }));

app.use('/health', healthRoutes);
app.use('/', usageRoutes);
app.use('/billing', billingRoutes);
app.use('/plans', plansRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON body.' });
  }

  res.status(500).json({ error: 'Internal server error.' });
});

export default app;