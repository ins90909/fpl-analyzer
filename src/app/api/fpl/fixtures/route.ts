import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLFixture } from '@/types/fpl';

export async function GET() {
  try {
    const cacheKey = 'fpl:fixtures';
    const cached = await redis.get<FPLFixture[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const res = await fetch('https://fantasy.premierleague.com/api/fixtures/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch fixtures' }, { status: 500 });
    }

    const data: FPLFixture[] = await res.json();
    await redis.set(cacheKey, data, { ex: 3600 });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}