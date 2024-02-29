import type { NextApiRequest, NextApiResponse } from 'next/types';

export default async function health(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      return await GET(res);
    }
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).end();
  }
}

async function GET(res: NextApiResponse) {
  return res.status(200).json({ status: 'ok' });
}
