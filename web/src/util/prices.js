// Map our custom plan IDs ("basic", "premium", etc) to Stripe price IDs
const stripePriceIds = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
};

// Get Stripe priceId
export const getStripePriceId = (planId) => stripePriceIds[planId];

// Get friendly plan ID ("basic", "premium", etc) by Stripe plan ID
// Used in auth.js to include planId in the user object
export const getFriendlyPlanId = (stripePriceId) =>
  Object.keys(stripePriceIds).find(
    (key) => stripePriceIds[key] === stripePriceId
  );
