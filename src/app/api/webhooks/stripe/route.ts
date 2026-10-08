import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe não configurado no servidor." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: any;

  if (webhookSecret && signature) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error("Erro na verificação da assinatura do Webhook Stripe:", err.message);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${err.message}` },
        { status: 400 }
      );
    }
  } else {
    // Modo tolerante caso webhook secret ainda não esteja cadastrado em ambiente inicial
    try {
      event = JSON.parse(rawBody);
    } catch (err: any) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const companyId = session.metadata?.companyId;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId) {
          await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
              status: "PAID",
              paidAt: new Date(),
              stripeInvoiceId:
                typeof session.payment_intent === "string"
                  ? session.payment_intent
                  : session.id,
            },
          });
        }

        if (companyId) {
          await prisma.company.update({
            where: { id: companyId },
            data: {
              financialStatus: "EM_DIA",
              stripeCustomerId:
                typeof session.customer === "string"
                  ? session.customer
                  : undefined,
              stripeSubscriptionId:
                typeof session.subscription === "string"
                  ? session.subscription
                  : undefined,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoiceObj = event.data.object;
        const customerId = invoiceObj.customer;

        if (customerId && typeof customerId === "string") {
          const company = await prisma.company.findFirst({
            where: { stripeCustomerId: customerId },
          });

          if (company) {
            await prisma.company.update({
              where: { id: company.id },
              data: { financialStatus: "EM_DIA" },
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = sub.customer;
        if (customerId && typeof customerId === "string") {
          await prisma.company.updateMany({
            where: { stripeCustomerId: customerId },
            data: { financialStatus: "EM_ATRASO" },
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoiceObj = event.data.object;
        const customerId = invoiceObj.customer;
        if (customerId && typeof customerId === "string") {
          await prisma.company.updateMany({
            where: { stripeCustomerId: customerId },
            data: { financialStatus: "ATRASADO" },
          });
        }
        break;
      }

      default:
        // Outros eventos recebidos
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro ao processar evento do Webhook Stripe:", error);
    return NextResponse.json(
      { error: "Erro interno ao processar webhook" },
      { status: 500 }
    );
  }
}
