/**
 * Walk the museum: every piece on its block in one long hall, to stroll through or jump across.
 * The page calls `openWalk` with the element to fill and gets back the two things it needs to tell the hall.
 */
export interface WalkOptions {
  /** Piece to start in front of. Without one the walk starts at the door. */
  start?: string;
  /** Day or night, as the building's one switch stands. */
  lights: boolean;
}
export interface Walk {
  /** Day turned to night, or back. */
  setLights(on: boolean): void;
  /** The visitor has left the page: stop drawing and let go of everything. */
  close(): void;
}

export function openWalk(host: HTMLElement, _options: WalkOptions): Walk {
  host.textContent = '';
  return { setLights: () => undefined, close: () => undefined };
}
