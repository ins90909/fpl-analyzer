import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLLeagueStandings } from '@/types/fpl';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid league ID' }, { status: 400 });
    }

    const cacheKey = `fpl:league:${id}`;
    const cached = await redis.get<FPLLeagueStandings>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const response = await fetch(
      `https://fantasy.premierleague.com/api/leagues-classic/${id}/standings/?page_standings=1`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch league standings' }, { status: response.status });
    }

    const data: FPLLeagueStandings = await response.json();
    await redis.set(cacheKey, data, { ex: 300 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
