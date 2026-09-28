import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLBootstrap, FPLPicksResponse } from '@/types/fpl';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: 'Invalid manager ID' }, { status: 400 });
    }

    const cachedBootstrap = await redis.get<FPLBootstrap>('fpl:bootstrap');
    let bootstrapData: FPLBootstrap;
    if (cachedBootstrap) {
      bootstrapData = cachedBootstrap;
    } else {
      const bootstrapRes = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!bootstrapRes.ok) {
        return NextResponse.json({ error: 'Failed to fetch bootstrap data' }, { status: 500 });
      }
      bootstrapData = await bootstrapRes.json();
      await redis.set('fpl:bootstrap', bootstrapData, { ex: 3600 });
    }
    const requestedEvent = req.nextUrl.searchParams.get('event');
    const eventId = requestedEvent !== null
      ? Number(requestedEvent)
      : bootstrapData.events.find((event) => event.is_current)?.id ??
        bootstrapData.events.find((event) => event.is_next)?.id ??
        [...bootstrapData.events].sort((a, b) => b.id - a.id).find((event) => event.finished)?.id ??
        1;

    if (
      !Number.isInteger(eventId) ||
      !bootstrapData.events.some((event) => event.id === eventId)
    ) {
      return NextResponse.json({ error: 'Invalid gameweek' }, { status: 400 });
    }

    const cacheKey = `fpl:picks:${id}:${eventId}`;
    const cached = await redis.get<FPLPicksResponse>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const picksRes = await fetch(
      `https://fantasy.premierleague.com/api/entry/${id}/event/${eventId}/picks/`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!picksRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch manager picks' }, { status: 404 });
    }

    const data: FPLPicksResponse = await picksRes.json();
    await redis.set(cacheKey, data, { ex: 600 });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}