import type { Piece } from './schema';
import { h1 } from './pieces/h1';
import { h2 } from './pieces/h2';
import { h3 } from './pieces/h3';
import { h4 } from './pieces/h4';
import { h5 } from './pieces/h5';
import { h6 } from './pieces/h6';
import { h7 } from './pieces/h7';

/** The whole collection, in the order a visitor walks it. */
export const pieces: Piece[] = [...h1, ...h2, ...h3, ...h4, ...h5, ...h6, ...h7];

export const pieceById = (id: string): Piece | undefined => pieces.find((p) => p.id === id);
export const inHall = (hall: number): Piece[] => pieces.filter((p) => p.hall === hall);

/** Inventory number: hall, then position in the hall. */
export const inv = (p: Piece): string => `${p.hall}.${String(inHall(p.hall).indexOf(p) + 1).padStart(2, '0')}`;
