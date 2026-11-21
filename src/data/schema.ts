export type HallId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Can you still get one? */
export type Status = 'production' | 'niche' | 'extinct' | 'lab';

/** Where the light in the image comes from. */
export type Principle = 'emits' | 'gates' | 'directs' | 'reflects' | 'moves';

/** Constraints a maker might filter by. */
export type Need = 'daylight' | 'unpowered' | 'seethrough' | 'depth' | 'midair' | 'dark';

/** paper: peer-reviewed or first publication. patent. archive: museum or institutional record. lab: the group that built it. maker: the artist's own page. press: journalism. reference: encyclopedia, used for cross-checks. */
export type SourceKind = 'paper' | 'patent' | 'archive' | 'lab' | 'maker' | 'press' | 'reference';

export interface Source {
  label: string;
  url: string;
  kind: SourceKind;
}

export interface Hall {
  id: HallId;
  name: string;
  was: string;
  intro: string;
}

export interface Piece {
  id: string;
  hall: HallId;
  name: string;
  aka?: string;
  /** Year used for sorting and for the placard. */
  year: number;
  /** Who and where, for the registry card. */
  origin: string;
  status: Status;
  statusNote: string;
  principle: Principle;
  needs: Need[];
  /** One sentence a visitor reads first. */
  lead: string;
  /** How it makes an image. Two to four short paragraphs. */
  how: string[];
  good: string[];
  bad: string[];
  /** What to try in the 3D viewer. */
  look: string;
  /** Set when the origin is contested or the record is thin. */
  dispute?: string;
  sources: Source[];
}

export const STATUS_LABEL: Record<Status, string> = {
  production: 'In production',
  niche: 'Specialist use',
  extinct: 'No longer made',
  lab: 'Laboratory only',
};

export const PRINCIPLE_LABEL: Record<Principle, string> = {
  emits: 'Makes its own light',
  gates: 'Shapes light from a separate lamp or laser',
  directs: 'Sends light in chosen directions',
  reflects: 'Reflects the light of the room',
  moves: 'Moves real objects',
};

export const NEED_LABEL: Record<Need, string> = {
  daylight: 'Readable in daylight',
  unpowered: 'Holds its image with the power off',
  seethrough: 'See-through',
  depth: 'Depth without glasses',
  midair: 'Image in mid-air',
  dark: 'Needs a dark room',
};
