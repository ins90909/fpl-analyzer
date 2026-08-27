import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLPicksResponse, FPLEvent } from '@/types/fpl';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `fpl:picks:${id}`;

    const cached = await redis.get<FPLPicksResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!bootstrapRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch bootstrap data' }, { status: 500 });
    }
    const bootstrapData = await bootstrapRes.json();
    const currentEvent =
      bootstrapData.events.find((e: FPLEvent) => e.is_current)?.id ||
      bootstrapData.events.find((e: FPLEvent) => e.is_next)?.id ||
      1;

    const picksRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${currentEvent}/picks/`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!picksRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch manager picks' }, { status: 404 });
    }

    const data: FPLPicksResponse = await picksRes.json();
    await redis.set(cacheKey, data, { ex: 600 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}