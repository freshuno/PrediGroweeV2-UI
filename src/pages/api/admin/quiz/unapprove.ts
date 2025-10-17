import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const base = process.env.ADMIN_SERVICE_URL || process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL;
  const apiKey = process.env.INTERNAL_API_KEY || process.env.ADMIN_INTERNAL_API_KEY;
  if (!base || !apiKey) return res.status(500).json({ error: 'Server misconfigured' });
  if (!req.headers.cookie) return res.status(401).json({ error: 'Not authenticated' });

  const upstream = await fetch(`${base}/admin/quiz/unapprove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
    body: JSON.stringify(req.body),
  });

  const text = await upstream.text();
  res.status(upstream.status).send(text);
}
