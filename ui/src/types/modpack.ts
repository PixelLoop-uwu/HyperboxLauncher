export type ModpackInfo = {
  version: string;
  gameMode: string;
  wipeDate: string;
}

export type Modpack = {
  name: string;
  url: string;
  id: string;
  description: string;
  online: number;
  info: ModpackInfo;
  mods: string[];
}