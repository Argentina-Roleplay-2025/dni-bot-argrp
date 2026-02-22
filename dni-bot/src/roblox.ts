// ── Helpers Roblox ─────────────────────────────────────────────────────────

export async function getRobloxData(
  username: string,
): Promise<{ id: number; name: string; avatarUrl: string; fullBodyUrl: string } | null> {
  try {
    const userRes  = await fetch("https://users.roblox.com/v1/usernames/users", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
    });
    const userData = await userRes.json() as any;
    if (!userData.data || userData.data.length === 0) return null;

    const userId = userData.data[0].id   as number;
    const name   = userData.data[0].name as string;

    const [bustRes, bodyRes] = await Promise.all([
      fetch(`https://thumbnails.roblox.com/v1/users/avatar-bust?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
      fetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
    ]);
    const bustData    = await bustRes.json() as any;
    const bodyData    = await bodyRes.json() as any;
    const avatarUrl   = bustData.data?.[0]?.imageUrl ?? "";
    const fullBodyUrl = bodyData.data?.[0]?.imageUrl ?? avatarUrl;
    return { id: userId, name, avatarUrl, fullBodyUrl };
  } catch {
    return null;
  }
}

export async function searchRobloxUsers(query: string): Promise<{ id: number; name: string }[]> {
  try {
    const [searchRes, exactRes] = await Promise.all([
      fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(query)}&limit=10`),
      fetch("https://users.roblox.com/v1/usernames/users", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ usernames: [query], excludeBannedUsers: false }),
      }),
    ]);
    const searchData    = await searchRes.json() as any;
    const exactData     = await exactRes.json()  as any;
    const searchResults = searchData.data ? (searchData.data as any[]).map((u) => ({ id: u.id as number, name: u.name as string })) : [];
    const exactResults  = exactData.data  ? (exactData.data  as any[]).map((u) => ({ id: u.id as number, name: u.name as string })) : [];
    const seen = new Set<number>();
    const combined: { id: number; name: string }[] = [];
    for (const u of [...exactResults, ...searchResults]) {
      if (!seen.has(u.id)) { seen.add(u.id); combined.push(u); }
    }
    return combined.slice(0, 10);
  } catch {
    return [];
  }
}
