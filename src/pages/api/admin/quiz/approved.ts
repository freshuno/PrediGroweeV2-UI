import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const quizBase = process.env.QUIZ_SERVICE_URL || process.env.NEXT_PUBLIC_QUIZ_SERVICE_URL;
  const apiKey = process.env.INTERNAL_API_KEY || process.env.QUIZ_INTERNAL_API_KEY;

  if (!quizBase || !apiKey) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  try {
    const upstream = await fetch(`${quizBase}/quiz/approved`, {
      headers: { 'X-Api-Key': apiKey },
    });
    const text = await upstream.text();
    res.status(upstream.status).send(text);
  } catch {
    res.status(502).json({ error: 'Proxy error' });
  }
}
