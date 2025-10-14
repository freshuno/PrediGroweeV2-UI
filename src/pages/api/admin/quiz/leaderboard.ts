import type { NextApiRequest, NextApiResponse } from 'next';
import axios, { AxiosError } from 'axios';

type LeaderboardRow = {
  user_id: number;
  education: string | null;
  country: string | null;
  total_answers: number;
  correct_answers: number;
  accuracy: number; // 0..1
};

type ApiErrorBody = { error: string; detail?: unknown };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LeaderboardRow[] | ApiErrorBody>
) {
  try {
    const { limit = '100', minAnswers = '10' } = req.query;
    const base = process.env.STATS_SERVICE_URL;
    if (!base) {
      return res.status(500).json({ error: 'STATS_SERVICE_URL is not set' });
    }

    const url = `${base}/stats/leaderboard?limit=${encodeURIComponent(
      String(limit)
    )}&minAnswers=${encodeURIComponent(String(minAnswers))}`;

    const r = await axios.get<LeaderboardRow[]>(url, {
      headers: { Cookie: req.headers.cookie ?? '' },
    });

    return res.status(200).json(r.data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const ae = err as AxiosError;
      const status = ae.response?.status ?? 500;
      const detail = ae.response?.data ?? ae.message;
      return res.status(status).json({
        error: 'failed to load leaderboard',
        detail,
      });
    }

    return res.status(500).json({
      error: 'failed to load leaderboard',
      detail: String(err),
    });
  }
}
