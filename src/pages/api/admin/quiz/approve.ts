import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const base = process.env.ADMIN_SERVICE_URL || process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL;
  if (!base) return res.status(500).json({ error: 'ADMIN_SERVICE_URL not set' });

  if (!req.headers.cookie) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const apiKey = process.env.INTERNAL_API_KEY || process.env.ADMIN_INTERNAL_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'INTERNAL_API_KEY not set' });

  const upstream = await fetch(`${base}/admin/quiz/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(req.body),
  });

  const text = await upstream.text();
  res.status(upstream.status).send(text);
}
