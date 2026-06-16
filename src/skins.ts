// src/skins.ts
export type TarotSkin = {
  name: string;
  folder: string;
  extension: "jpg" | "png";
};

export const SKINS: TarotSkin[] = [
  { name: "Default", folder: "default", extension: "jpg" },
  { name: "Oswald Wirth (MAJOR)", folder: "oswaldwirth", extension: "jpg" },
  { name: "Sola Busca (MAJOR)", folder: "sola", extension: "jpg" },
  { name: "JoJo (MAJOR)", folder: "jojo", extension: "png" },
  { name: "DELTARUNE (MAJOR)", folder: "deltarune", extension: "png" },
  { name: "UNDERTALE (MAJOR)", folder: "undertale", extension: "png" },
]