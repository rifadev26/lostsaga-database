export interface ServerInfo {
  alias: string;
  name: string;
}

export const SERVERLIST: ServerInfo[] = [
  { alias: "LSK", name: "Korea LS" },
  { alias: "RUBY", name: "RUBY LS" },
  { alias: "EXOTIC", name: "EXOTIC REBORN" },
  { alias: "THAILAND", name: "THAILAND LS" },
  { alias: "REBIRTH", name: "REBIRTH LS" },
];

export function getServerAlias(alias: string): string | undefined {
  return SERVERLIST.find(
    (s) => s.alias.toLowerCase() === alias.toLowerCase(),
  )?.alias;
}
