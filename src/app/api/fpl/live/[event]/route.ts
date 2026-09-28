import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLLiveResponse } from '@/types/fpl';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ event: string }> }
) {
  try {
    const { event } = await params;
    if (!/^\d+$/.test(event) || Number(event) < 1) {
      return NextResponse.json({ error: 'Invalid gameweek' }, { status: 400 });
    }

    const cacheKey = `fpl:live:${event}`;
    const cached = await redis.get<FPLLiveResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const response = await fetch(
      `https://fantasy.premierleague.com/api/event/${event}/live/`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch gameweek points' }, { status: response.status });
    }

    const data: FPLLiveResponse = await response.json();
    await redis.set(cacheKey, data, { ex: 3600 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
