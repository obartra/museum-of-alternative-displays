/**
 * Places to look from that a piece offers beside the whole view.
 * A person view puts the visitor where the piece is meant to be met: in the seat, at the eyepiece, across the hall.
 * A detail view goes close to the part that does the work.
 *
 * The words live here, with the rest of the text, so that the page can show the buttons before any 3D has loaded and so
 * that they can be translated. The camera positions live with the model, under the same id (`views` in its builder).
 */
export interface ViewInfo {
  id: string;
  kind: 'person' | 'detail';
  /** What the button says. Short, and in the visitor's terms: "Sit down", "Look in". */
  label: string;
  /** One line shown over the picture while the view is on: what to notice from here. */
  hint?: string;
}

export const views: Record<string, ViewInfo[]> = {
  'mechanical-television': [{ id: 'eyepiece', kind: 'person', label: 'Look in' }],
  'peppers-ghost': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
  'stereoscope': [{ id: 'eyepiece', kind: 'person', label: 'Look in' }],
  'head-mounted': [{ id: 'worn', kind: 'person', label: 'Put it on' }],
  'head-up': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
};

export const viewsOf = (pieceId: string): ViewInfo[] => views[pieceId] ?? [];
