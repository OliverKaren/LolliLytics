import { useQuery } from '@tanstack/react-query';

export interface Champion {
  id: string;        // e.g. "Jinx", "MissFortune"
  name: string;      // e.g. "Jinx", "Miss Fortune"
  key: string;       // numeric string e.g. "222"
  iconUrl: string;
}

const VERSIONS_URL = 'https://ddragon.leagueoflegends.com/api/versions.json';

async function fetchChampions(): Promise<Champion[]> {
  // 1. Get latest patch version
  const versionsRes = await fetch(VERSIONS_URL);
  const versions: string[] = await versionsRes.json();
  const latestVersion = versions[0];

  // 2. Fetch champion data
  const champRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/data/en_US/champion.json`,
  );
  const champData = await champRes.json();

  // 3. Map to our Champion type
  return Object.values(champData.data as Record<string, any>).map((champ) => ({
    id: champ.id,
    name: champ.name,
    key: champ.key,
    iconUrl: `https://ddragon.leagueoflegends.com/cdn/${latestVersion}/img/champion/${champ.id}.png`,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function useChampions() {
  return useQuery<Champion[]>({
    queryKey: ['champions'],
    queryFn: fetchChampions,
    staleTime: 1000 * 60 * 60 * 24, // 24h — champion list rarely changes
    gcTime: 1000 * 60 * 60 * 24,
  });
}

// Helper: get icon URL directly without the hook (for static use)
export function getChampionIconUrl(championId: string, version = '14.24.1') {
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
}
