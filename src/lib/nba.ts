export type NbaTeam = {
  code: string;
  city: string;
  name: string;
  primary: string;
  secondary: string;
};

export const NBA_TEAMS: NbaTeam[] = [
  { code: "ATL", city: "Atlanta", name: "Hawks", primary: "#E03A3E", secondary: "#C1D32F" },
  { code: "BOS", city: "Boston", name: "Celtics", primary: "#007A33", secondary: "#BA9653" },
  { code: "BKN", city: "Brooklyn", name: "Nets", primary: "#111111", secondary: "#FFFFFF" },
  { code: "CHA", city: "Charlotte", name: "Hornets", primary: "#1D1160", secondary: "#00788C" },
  { code: "CHI", city: "Chicago", name: "Bulls", primary: "#CE1141", secondary: "#111111" },
  { code: "CLE", city: "Cleveland", name: "Cavaliers", primary: "#860038", secondary: "#FDBB30" },
  { code: "DAL", city: "Dallas", name: "Mavericks", primary: "#00538C", secondary: "#B8C4CA" },
  { code: "DEN", city: "Denver", name: "Nuggets", primary: "#0E2240", secondary: "#FEC524" },
  { code: "DET", city: "Detroit", name: "Pistons", primary: "#C8102E", secondary: "#1D42BA" },
  { code: "GSW", city: "Golden State", name: "Warriors", primary: "#1D428A", secondary: "#FFC72C" },
  { code: "HOU", city: "Houston", name: "Rockets", primary: "#CE1141", secondary: "#C4CED4" },
  { code: "IND", city: "Indiana", name: "Pacers", primary: "#002D62", secondary: "#FDBB30" },
  { code: "LAC", city: "LA", name: "Clippers", primary: "#C8102E", secondary: "#1D428A" },
  { code: "LAL", city: "Los Angeles", name: "Lakers", primary: "#552583", secondary: "#FDB927" },
  { code: "MEM", city: "Memphis", name: "Grizzlies", primary: "#5D76A9", secondary: "#12173F" },
  { code: "MIA", city: "Miami", name: "Heat", primary: "#98002E", secondary: "#F9A01B" },
  { code: "MIL", city: "Milwaukee", name: "Bucks", primary: "#00471B", secondary: "#EEE1C6" },
  { code: "MIN", city: "Minnesota", name: "Timberwolves", primary: "#0C2340", secondary: "#78BE20" },
  { code: "NOP", city: "New Orleans", name: "Pelicans", primary: "#0C2340", secondary: "#C8102E" },
  { code: "NYK", city: "New York", name: "Knicks", primary: "#006BB6", secondary: "#F58426" },
  { code: "OKC", city: "Oklahoma City", name: "Thunder", primary: "#007AC1", secondary: "#EF3B24" },
  { code: "ORL", city: "Orlando", name: "Magic", primary: "#0077C0", secondary: "#C4CED4" },
  { code: "PHI", city: "Philadelphia", name: "76ers", primary: "#006BB6", secondary: "#ED174C" },
  { code: "PHX", city: "Phoenix", name: "Suns", primary: "#1D1160", secondary: "#E56020" },
  { code: "POR", city: "Portland", name: "Trail Blazers", primary: "#E03A3E", secondary: "#111111" },
  { code: "SAC", city: "Sacramento", name: "Kings", primary: "#5A2D81", secondary: "#A2AAAD" },
  { code: "SAS", city: "San Antonio", name: "Spurs", primary: "#111111", secondary: "#C4CED4" },
  { code: "TOR", city: "Toronto", name: "Raptors", primary: "#CE1141", secondary: "#111111" },
  { code: "UTA", city: "Utah", name: "Jazz", primary: "#002B5C", secondary: "#F9A01B" },
  { code: "WAS", city: "Washington", name: "Wizards", primary: "#002B5C", secondary: "#E31837" },
];

export function nbaTeam(code: string | null | undefined): NbaTeam | undefined {
  return code ? NBA_TEAMS.find((t) => t.code === code) : undefined;
}

export function teamColors(code: string | null | undefined) {
  const t = nbaTeam(code);
  return { primary: t?.primary ?? "#2a2f3d", secondary: t?.secondary ?? "#8a93a6" };
}
