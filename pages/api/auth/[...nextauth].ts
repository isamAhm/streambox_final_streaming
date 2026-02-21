// NextAuth is removed in favor of Clerk. Keeping this file to avoid 404s if referenced,
// but it returns 410 Gone to signal deprecation.
import type { NextApiRequest, NextApiResponse } from 'next';
export default function handler(_req: NextApiRequest, res: NextApiResponse) {
  res.status(410).json({ message: 'NextAuth has been removed. Use Clerk instead.' });
}
