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
    { id: 'hall', kind: 'person', label: 'Wait on the concourse', hint: 'People waiting learned to look up at the clatter. Here one leaf falls every second.' },
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
  // hall 2, glass and glow
  'cathode-ray-tube': [
    { id: 'seat', kind: 'person', label: 'Sit in front', hint: 'The band moving down the face is the raster, slowed about sixty times. One beam paints it line by line.' },
    { id: 'raster', kind: 'detail', label: 'Go close to the face', hint: 'The picture is made of horizontal lines. The beam sweeps them from top to bottom, over and over.' },
    { id: 'gun', kind: 'detail', label: 'Look into the neck', hint: 'The gun. A heated cathode gives off electrons, and the copper coils round the neck steer the beam.' },
  ],
  'vector-display': [
    { id: 'seat', kind: 'person', label: 'Sit at the console', hint: 'The beam draws each stroke directly, like a pen. The trail behind the ball is phosphor still glowing.' },
    { id: 'trace', kind: 'detail', label: 'Go close to the trace', hint: 'No dots and no scan lines. Each stroke is one smooth pass of the beam, at any angle.' },
  ],
  'storage-tube': [
    { id: 'seat', kind: 'person', label: 'Sit at the terminal', hint: 'The plot is drawn once and stays lit, stored in the tube itself. The flash is the only way to erase it.' },
  ],
  'nixie-tube': [
    { id: 'stack', kind: 'detail', label: 'Go close to one tube', hint: 'Ten shaped cathodes stacked front to back inside a mesh anode. Neon glows round the one that is energised.' },
  ],
  'vacuum-fluorescent': [
    { id: 'grid', kind: 'detail', label: 'Look across the glass', hint: 'Thin hot wires in front, a mesh grid behind them, then the phosphor segments. Every lead leaves at the bottom.' },
  ],
  'numitron': [
    { id: 'filaments', kind: 'detail', label: 'Go close to one bulb', hint: 'Seven lamp filaments strung between posts. The lit ones are glowing wire, and that is all the light there is.' },
  ],
  'plasma-panel': [
    { id: 'seat', kind: 'person', label: 'Sit in front', hint: 'A classroom terminal. Every orange dot is a small neon discharge. Infrared beams across the frame find a finger.' },
    { id: 'dots', kind: 'detail', label: 'Go close to the dots', hint: 'Each dot is one gas cell between two sheets of glass. A lit cell is a small neon sign.' },
  ],
  'field-emission': [
    { id: 'tips', kind: 'detail', label: 'Go down to the tips', hint: 'A cold cathode tip under every hole in the gate. Electrons leave the tips and cross the gap to the phosphor above.' },
  ],
  'eggcrate': [
    { id: 'below', kind: 'person', label: 'Look up at the board', hint: 'A scoreboard as the crowd met it. The lamps do not snap on and off: they swell and die away.' },
    { id: 'lamps', kind: 'detail', label: 'Go close to the lamps', hint: 'Ordinary bulbs, each in its own cell of the baffle so that its light does not spill on to its neighbours.' },
  ],
  // hall 3, solid light
  'led-display': [
    { id: 'below', kind: 'person', label: 'Stand under it', hint: 'Outdoor signs hang high. The shade over each row keeps the sun off the lamps and never hides them from below.' },
    { id: 'lamps', kind: 'detail', label: 'Go close to the lamps', hint: 'Three lamps to a pixel: red, green and blue. Amber is red and green lit together, with the blue left dark.' },
  ],
  'oled': [
    { id: 'seat', kind: 'person', label: 'Sit in front', hint: 'Switch the daylight off. The black of the panel goes with it and only the colours are left.' },
  ],
  'microled': [
    { id: 'socket', kind: 'detail', label: 'Look into the socket', hint: 'A tile has been lifted out. Behind it: the backplane, power and data sockets, and the four magnets that hold a tile.' },
  ],
  'thin-film-el': [
    { id: 'dots', kind: 'detail', label: 'Go close to the dots', hint: 'Each dot is one crossing of two electrode strips. The yellow is what the film itself emits, not a filter.' },
  ],
  'transparent-display': [
    { id: 'window', kind: 'person', label: 'Stand at the window', hint: 'The figures are light added on the glass, and the clock stands behind it. Move your head and they slide apart.' },
  ],
  'flexible-display': [
    { id: 'edge', kind: 'detail', label: 'Look along the edge', hint: 'The sheet is the whole display: thin films on plastic, with nothing behind. It winds on to the drum below.' },
  ],
  'peppers-ghost': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
  'stereoscope': [{ id: 'eyepiece', kind: 'person', label: 'Look in' }],
  'head-mounted': [{ id: 'worn', kind: 'person', label: 'Put it on' }],
  'head-up': [{ id: 'seat', kind: 'person', label: 'Sit down' }],
};

export const viewsOf = (pieceId: string): ViewInfo[] => views[pieceId] ?? [];
