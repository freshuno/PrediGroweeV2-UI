import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';

const ALLOWED_PAGES = ['about', 'privacy', 'contact'] as const;
type AllowedPage = (typeof ALLOWED_PAGES)[number];

export function isAllowedPage(page: string): page is AllowedPage {
  return ALLOWED_PAGES.includes(page as AllowedPage);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const page = req.query.page as string;
  if (!isAllowedPage(page)) {
    return res.status(400).json({ error: 'Invalid page' });
  }
  const contentPath = path.join('/app/content', `${page}.json`);
  if (req.method === 'POST') {
    const requestBody = req.body;
    if (!requestBody.content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    try {
      await fs.writeFile(contentPath, JSON.stringify(requestBody.content, null, 2), 'utf8');
      res.status(200).json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to save content' });
    }
  }

  try {
    const content = await fs.readFile(contentPath, 'utf8');
    res.status(200).json({ content: JSON.parse(content) });
  } catch {
    res.status(404).json({ error: 'Content not found' });
  }
}
