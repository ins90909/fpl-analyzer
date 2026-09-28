import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLManagerLeagues } from '@/types/fpl';

function hasManagerLeagues(
  value: unknown
): value is { leagues: FPLManagerLeagues } {
  if (!value || typeof value !== 'object') return false;
  const profile = value as { leagues?: Partial<FPLManagerLeagues> };
  return Boolean(
    profile.leagues &&
      Array.isArray(profile.leagues.classic) &&
      Array.isArray(profile.leagues.h2h)
  );
}

function isManagerLeague(
  league: FPLManagerLeagues['classic'][number] | null
): league is FPLManagerLeagues['classic'][number] {
  return Boolean(
    league &&
      Number.isInteger(league.id) &&
      league.id > 0 &&
      typeof league.name === 'string'
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    const cacheKey = `fpl:manager:${id}:leagues`;
    const cached = await redis.get<FPLManagerLeagues>(cacheKey);
    if (cached) return NextResponse.json(cached);

    const response = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Could not fetch this manager’s leagues.' },
        { status: response.status }
      );
    }

    const payload: unknown = await response.json();
    if (!hasManagerLeagues(payload)) {
      return NextResponse.json(
        { error: 'FPL returned an unexpected manager leagues response.' },
        { status: 502 }
      );
    }

    const data = {
      classic: payload.leagues.classic.filter(isManagerLeague),
      h2h: payload.leagues.h2h.filter(isManagerLeague),
    };
    await redis.set(cacheKey, data, { ex: 900 });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
