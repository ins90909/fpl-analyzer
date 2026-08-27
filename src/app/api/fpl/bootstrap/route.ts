import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { FPLBootstrap } from '@/types/fpl';

const CACHE_KEY = 'fpl:bootstrap';
const CACHE_TTL = 3600; // 1 hour in seconds

export async function GET() {
  try {
    const cachedData = await redis.get<FPLBootstrap>(CACHE_KEY);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const res = await fetch('https://fantasy.premierleague.com/api/bootstrap-static/', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch FPL bootstrap data: ${res.status}`);
    }

    const data: FPLBootstrap = await res.json();
    await redis.set(CACHE_KEY, data, { ex: CACHE_TTL });

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}