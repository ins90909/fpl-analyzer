import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLPlayerSummary } from '@/types/fpl';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 });
    }

    const cacheKey = `fpl:player:${id}`;
    const cached = await redis.get<FPLPlayerSummary>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const response = await fetch(
      `https://fantasy.premierleague.com/api/element-summary/${id}/`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch player details' }, { status: response.status });
    }

    const data: FPLPlayerSummary = await response.json();
    await redis.set(cacheKey, data, { ex: 900 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
