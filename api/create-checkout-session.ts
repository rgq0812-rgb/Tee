import { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const stripe = getStripe();
    const { plan, userId } = req.body;
    const host = req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const origin = `${protocol}://${host}`;

    const amount = plan === 'yearly' ? 7900 : 999;
    const name = plan === 'yearly' ? 'THE CHOSE - ELITE PASS (ANNUEL)' : 'THE CHOSE - ELITE PASS (MENSUEL)';
    const description = plan === 'yearly' ? 'Accès premium illimité pendant 1 an.' : 'Accès premium illimité pendant 1 mois.';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: name,
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/?payment_status=success`,
      cancel_url: `${origin}/?payment_status=cancel`,
      metadata: {
        userId: userId,
        plan: plan
      }
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error('[STRIPE ERROR]', err);
    res.status(500).json({ error: err.message });
  }
}
