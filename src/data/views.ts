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
  // hall 1, mechanics
  'split-flap': [
    { id: 'hall', kind: 'person', label: 'Wait on the concourse', hint: 'Stations came to rely on the clatter: people looked up when they heard it. Here one leaf falls every second.' },
    { id: 'flaps', kind: 'detail', label: 'Go close to the leaves', hint: 'Behind each numeral stands a sheaf of waiting leaves, hinged on pins round a drum. Two pips hold the top one up.' },
  ],
  'flip-disc': [
    { id: 'kerb', kind: 'person', label: 'Wait at the stop', hint: 'As on the front of a bus. The board reflects daylight and makes none, and the bottom row fills a disc a second.' },
    { id: 'discs', kind: 'detail', label: 'Go close to the discs', hint: 'Each disc sits on an axle. A pulse through the copper coils under it kicks it over, and it stays with no current.' },
  ],
  'mechanical-television': [
    { id: 'eyepiece', kind: 'person', label: 'Look in', hint: 'Thirty lines of flickering neon, seen through the moving holes. Hours above, minutes below.' },
    { id: 'disc', kind: 'detail', label: 'Follow the spiral', hint: 'Thirty holes, each one hole\'s width nearer the centre than the last. One turn of the disc is one picture.' },
  ],
  'kinetic-mirror': [
    { id: 'stand', kind: 'person', label: 'Stand in front of it', hint: 'The dark shape is you. A camera in the middle watches, and the tiles tip to match as you move your head.' },
    { id: 'tiles', kind: 'detail', label: 'Go close to the tiles', hint: 'Each tile tips on its own servo. Tipped one way it catches the light, the other way it falls into shadow.' },
  ],
  'shape-display': [
    { id: 'table', kind: 'person', label: 'Stand at the table', hint: 'The surface is the picture. A bump travels across the pins and carries the red ball with it.' },
    { id: 'pins', kind: 'detail', label: 'Get down among the pins', hint: 'Every pin is driven to its own height by a motor underneath. Height is all there is: no overhangs.' },
  ],
  'braille-display': [
    { id: 'touch', kind: 'person', label: 'Run a finger along it', hint: 'What a fingertip meets: round pins, up or down, eight to a cell. The right-hand cells change every second.' },
    { id: 'cell', kind: 'detail', label: 'See inside one cell', hint: 'The last cell, taken out and enlarged. A strip of piezo crystal bends under each dot and lifts its pin.' },
  ],
  'drone-show': [
    { id: 'field', kind: 'person', label: 'Stand on the field', hint: 'Each point of light is an aircraft on its own planned route. They write the time, then regroup into a globe.' },
    { id: 'close', kind: 'detail', label: 'Fly up to one', hint: 'Every light hangs under a small quadcopter, kept within centimetres of its place by satellite positioning.' },
  ],
  'peppers-ghost': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
  'stereoscope': [{ id: 'eyepiece', kind: 'person', label: 'Look in' }],
  'head-mounted': [{ id: 'worn', kind: 'person', label: 'Put it on' }],
  'head-up': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
};

export const viewsOf = (pieceId: string): ViewInfo[] => views[pieceId] ?? [];
