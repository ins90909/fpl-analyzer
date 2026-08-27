import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.trim();

  if (!query) {
    return NextResponse.json({ isNumeric: false, results: [] });
  }

  // 1. Direct Numeric Manager ID Lookup
  if (/^\d+$/.test(query)) {
    const entryId = parseInt(query, 10);
    try {
      const res = await fetch(`https://fantasy.premierleague.com/api/entry/${entryId}/`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({
          isNumeric: true,
          entryId,
          results: [
            {
              entryId,
              managerName: `${data.player_first_name} ${data.player_last_name}`,
              teamName: data.name,
            },
          ],
        });
      }
    } catch {
      // Fall through if endpoint fails
    }
  }

  // 2. Name Search via Top Overall League Standings (League 314)
  try {
    const leagueRes = await fetch(
      'https://fantasy.premierleague.com/api/leagues-classic/314/standings/?page_standings=1',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (leagueRes.ok) {
      const leagueData = await leagueRes.json();
      const results = (leagueData.standings.results || [])
        .filter(
          (item: any) =>
            item.player_name.toLowerCase().includes(query.toLowerCase()) ||
            item.entry_name.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map((item: any) => ({
          entryId: item.entry,
          managerName: item.player_name,
          teamName: item.entry_name,
        }));

      return NextResponse.json({
        isNumeric: false,
        results,
      });
    }
  } catch {
    // Return empty results on failure
  }

  return NextResponse.json({ isNumeric: false, results: [] });
}