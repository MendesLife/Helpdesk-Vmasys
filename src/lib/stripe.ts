import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const isStripeConfigured = Boolean(stripeSecretKey && stripeSecretKey.trim().length > 0);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey as string, {
      apiVersion: "2025-02-24.acacia" as any,
      appInfo: {
        name: "VMASYS Helpdesk & Sites",
        version: "1.0.0",
      },
    })
  : null;

export function getStripeClient(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe não configurado. Por favor, adicione a variável de ambiente STRIPE_SECRET_KEY no seu arquivo .env ou nas variáveis da Vercel."
    );
  }
  return stripe;
}
