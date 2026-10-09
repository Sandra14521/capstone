import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from .env');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function createCheckoutSession({
  tenantId,
  customerId,
}) {
  if (!process.env.STRIPE_PRO_PRICE_ID) {
    throw new Error('STRIPE_PRO_PRICE_ID is missing from .env');
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    client_reference_id: tenantId,
    metadata: { tenantId },
    subscription_data: {
      metadata: { tenantId },
    },
    success_url: process.env.CHECKOUT_SUCCESS_URL,
    cancel_url: process.env.CHECKOUT_CANCEL_URL,
    ...(customerId ? { customer: customerId } : {}),
  });

  return session;
}