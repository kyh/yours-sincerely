import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "./utils";
import { getStripePriceId } from "./prices";

let stripe;
// Load the Stripe script
loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, {
  // Pin to specific version of the Stripe API
  apiVersion: "2020-08-27",
}).then((stripeInstance) => {
  // Set stripe so all functions below have it in scope
  stripe = stripeInstance;
});

export const redirectToCheckout = async (planId) => {
  // Create a checkout session
  const session = await apiRequest("stripe-create-checkout-session", "POST", {
    priceId: getStripePriceId(planId),
    successUrl: `${window.location.origin}/profile?paid=true`,
    cancelUrl: `${window.location.origin}/pricing`,
  });

  // Ensure if user clicks browser back button from checkout they go to /pricing
  // instead of this page or they'll redirect right back to checkout.
  window.history.replaceState({}, "", "/pricing");

  // Redirect to checkout
  return stripe.redirectToCheckout({
    sessionId: session.id,
  });
};

export const redirectToBilling = async () => {
  // Create a billing session
  const session = await apiRequest("stripe-create-billing-session", "POST", {
    returnUrl: `${window.location.origin}/settings/general`,
  });

  // Ensure if user clicks browser back button from billing they go to /settings/general
  // instead of this page or they'll redirect right back to billing.
  window.history.replaceState({}, "", "/settings/general");

  // Redirect to billing session url
  window.location.href = session.url;
};
