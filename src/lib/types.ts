export type Position = "POR" | "DEF" | "MED" | "DEL";

export interface Player {
  id: string;
  name: string;
  nickname?: string;
  number?: number;
  position: Position;
  positionLabel: string;
  /** Ruta bajo /public. Sin foto se genera una composición provisional. */
  photo?: string;
  bio?: string;
  age?: number;
  height?: string;
  foot?: string;
  nationality?: string;
  stats?: { label: string; value: number }[];
}

export interface Match {
  id: string;
  opponent: string;
  date: string; // ISO (instante)
  home: boolean;
  venue?: string;
  competition?: string;
  score?: { us: number; them: number };
  note?: string;
}

export type Category = "partidos" | "entrenamientos" | "celebraciones" | "momentos";
export interface GalleryItem {
  id: string;
  type: "photo" | "video" | "youtube";
  category: Category;
  title: string;
  caption?: string;
  src?: string; // foto, o fichero de vídeo
  youtubeId?: string;
  ratio: number;
}

export interface ClubContent {
  manifesto: string;
  values: { word: string; text: string }[];
  quote: { text: string; by: string };
}
export interface Content {
  players: Player[];
  matches: Match[];
  gallery: GalleryItem[];
  club: ClubContent;
  builtAt: number;
}
