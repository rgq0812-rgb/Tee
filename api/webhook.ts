import { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe, db, admin, stripeWebhookSecret } from './_lib/db';
import { Readable } from 'stream';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const stripe = getStripe();
    if (!stripeWebhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not set');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const event = stripe.webhooks.constructEvent(buf, sig!, stripeWebhookSecret);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`[WEBHOOK] Payment successful for user ${userId}. Updating subscription...`);
        await db.collection('users').doc(userId).set({
          subscriptionStatus: 'active',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          stripeCustomerId: session.customer as string,
          lastPaymentId: session.payment_intent as string
        }, { merge: true });
        console.log(`[WEBHOOK] User ${userId} successfully upgraded to ACTIVE.`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err: any) {
    console.error(`[WEBHOOK ERROR] ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
}
