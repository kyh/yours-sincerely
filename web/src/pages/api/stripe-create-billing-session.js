const requireAuth = require("./_require-auth");
const { getUser } = require("./_db");
const stripe = require("./_stripe");

export default requireAuth(async (req, res) => {
  const body = req.body;
  const user = req.user;

  try {
    const { stripeCustomerId } = await getUser(user.uid);

    // Create a billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: body.returnUrl,
    });

    // Return success response
    res.send({ status: "success", data: session });
  } catch (error) {
    console.log("stripe-create-billing-session error", error);

    // Return error response
    res.send({ status: "error", code: error.code, message: error.message });
  }
});
