import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLManagerData } from '@/types/fpl';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    const cacheKey = `fpl:manager:${id}`;
    const cached = await redis.get<FPLManagerData>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const headers = { 'User-Agent': 'Mozilla/5.0' };
    const [historyRes, transfersRes] = await Promise.all([
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/history/`, { headers }),
      fetch(`https://fantasy.premierleague.com/api/entry/${id}/transfers/`, { headers }),
    ]);

    if (!historyRes.ok || !transfersRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch manager history' }, { status: 502 });
    }

    const data: FPLManagerData = {
      history: await historyRes.json(),
      transfers: await transfersRes.json(),
    };
    await redis.set(cacheKey, data, { ex: 900 });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
