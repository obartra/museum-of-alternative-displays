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
  'water-curtain': [
    { id: 'across', kind: 'person', label: 'Stand across the room', hint: 'From here the drops read as a picture: the time, falling whole into the basin. Each lasts about a second.' },
    { id: 'under', kind: 'detail', label: 'Look up at the valves', hint: 'The bottom row of the picture leaves first. Each row above it leaves a moment later, so the shape holds as it falls.' },
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
    { id: 'screen', kind: 'detail', label: 'Go close to the screen', hint: 'Nothing redraws these lines. They stay lit on the face of the tube until the whole face is flashed clean.' },
  ],
  'nixie-tube': [
    { id: 'desk', kind: 'person', label: 'Stand in front', hint: 'Each figure glows in its own place, a little in front of or behind the next, because the ten cathodes stand one behind another.' },
    { id: 'stack', kind: 'detail', label: 'Go close to one tube', hint: 'Ten shaped cathodes stacked front to back inside a mesh anode. Neon glows round the one that is energised.' },
  ],
  'vacuum-fluorescent': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The light comes from phosphor behind the wires. The hot filaments in front are so fine that they hardly show.' },
    { id: 'grid', kind: 'detail', label: 'Look across the glass', hint: 'Thin hot wires in front, a mesh grid behind them, then the phosphor segments. Every lead leaves at the bottom.' },
  ],
  'numitron': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'Each figure is made of seven lamp filaments, glowing the warm yellow of a light bulb.' },
    { id: 'filaments', kind: 'detail', label: 'Go close to one bulb', hint: 'Seven lamp filaments strung between posts. The lit ones are glowing wire, and that is all the light there is.' },
  ],
  'plasma-panel': [
    { id: 'seat', kind: 'person', label: 'Sit in front', hint: 'A classroom terminal. Every orange dot is a small neon discharge. Infrared beams across the frame find a finger.' },
    { id: 'dots', kind: 'detail', label: 'Go close to the dots', hint: 'Each dot is one gas cell between two sheets of glass. A lit cell is a small neon sign.' },
  ],
  'field-emission': [
    { id: 'tips', kind: 'detail', label: 'Go down to the tips', hint: 'A cold cathode tip under every hole in the gate. Electrons leave the tips and cross the gap to the phosphor above.' },
    { id: 'phosphor', kind: 'detail', label: 'Look down on the phosphor', hint: 'Each dot of phosphor glows where electrons pulled from the cold tips below it strike.' },
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
    { id: 'edge', kind: 'detail', label: 'Look along the edge', hint: 'The panel is a few millimetres thick. Every pixel makes its own light, so there is no lamp behind it.' },
  ],
  'microled': [
    { id: 'wall', kind: 'person', label: 'Stand back from the wall', hint: 'Close up, the wall is tiles. From here the seams vanish, and the LEDs are too small to see.' },
    { id: 'socket', kind: 'detail', label: 'Look into the socket', hint: 'A tile has been lifted out. Behind it: the backplane, power and data sockets, and the four magnets that hold a tile.' },
  ],
  'thin-film-el': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The yellow light comes from a film of zinc sulphide itself, with no lamp behind it.' },
    { id: 'dots', kind: 'detail', label: 'Go close to the dots', hint: 'Each dot is one crossing of two electrode strips. The yellow is what the film itself emits, not a filter.' },
  ],
  'transparent-display': [
    { id: 'window', kind: 'person', label: 'Stand at the window', hint: 'The figures are light added on the glass, and the clock stands behind it. Move your head and they slide apart.' },
    { id: 'pane', kind: 'detail', label: 'Go close to the pane', hint: 'The screen can only add light to what is behind it. Where its picture would be black, you see the clock.' },
  ],
  'flexible-display': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The sheet bends and rolls onto the drum below, and the picture carries on across the bend.' },
    { id: 'edge', kind: 'detail', label: 'Look along the edge', hint: 'The sheet is the whole display: thin films on plastic, with nothing behind. It winds on to the drum below.' },
  ],
  // hall 4, light valves
  'camera-obscura': [
    { id: 'inside', kind: 'person', label: 'Step inside', hint: 'The chamber is closed and dark. The view from the windows lies on the paper upside down: sky below, town above.' },
    { id: 'hole', kind: 'detail', label: 'Go close to the hole', hint: 'A brass disc turns between a small hole and a lens. The lens has the wider opening, so it lets in more light.' },
  ],
  'shadow-play': [
    { id: 'audience', kind: 'person', label: 'Sit with the audience', hint: 'Only shadows reach this side. Held against the cloth, a figure is small and sharp. Out by the lamp it grows and blurs.' },
    { id: 'behind', kind: 'detail', label: 'Go behind the screen', hint: 'The figures are flat, pierced and painted, each on its rod. One flame lights them all, and it never holds still.' },
  ],
  'switchable-glass': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The clock behind the pane shows only while the pane is clear. With the power off, the pane is frosted.' },
    { id: 'close', kind: 'detail', label: 'Go close to the pane', hint: 'Frosted, the film scatters light every way. The lamp on the switch box shows when the voltage is on.' },
  ],
  'hidden-lcd': [
    { id: 'front', kind: 'person', label: 'Sit in front', hint: 'The screen looks white. Through the turning filter the clock comes back, and at a quarter turn its colours reverse.' },
    { id: 'close', kind: 'detail', label: 'Look through the filter', hint: 'Every dot is as bright as the next. What changes from dot to dot is the angle of its light, which only a filter sees.' },
  ],
  'liquid-crystal': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'From the front the layers line up into one screen. Seen from the side, as at the rail, they come apart.' },
    { id: 'layers', kind: 'detail', label: 'Go between the layers', hint: 'The crystal layer alone shows only grey. It sets how far each cell twists the light. The colour comes from the filter.' },
  ],
  'micromirror': [
    { id: 'mirrors', kind: 'detail', label: 'Go close to the mirrors', hint: 'A few mirrors, enlarged several thousand times. Each rocks on its diagonal: one way sends light to the lens.' },
    { id: 'chip', kind: 'detail', label: 'Look at the chip', hint: 'The field of mirrors above is a corner of this chip, enlarged. On the chip itself each mirror is far too small to see.' },
  ],
  'lcos': [
    { id: 'cube', kind: 'detail', label: 'Follow the light', hint: 'The cube turns the light of the lamp down onto the chip. Only light the chip has twisted leaves through the lens.' },
    { id: 'chip', kind: 'detail', label: 'Go close to the chip', hint: 'The liquid crystal lies on a mirror-backed silicon chip, so the light passes through it twice, down and back up.' },
  ],
  'eidophor': [
    { id: 'machine', kind: 'person', label: 'Stand back from the machine', hint: 'The panels are off, so the parts stand in view: the beam, the oil on its mirror, the bars and the lens.' },
    { id: 'oil', kind: 'detail', label: 'Go close to the oil', hint: 'A film of oil on a turning mirror. The electron beam dimples it, and only light bent by a dimple passes the bars.' },
  ],
  'scanned-laser': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The hands of the clock are drawn by one beam moving too fast to follow. You see its path, not the dot.' },
    { id: 'galvos', kind: 'detail', label: 'Go close to the mirrors', hint: 'Two small mirrors on fast motors. One swings the beam left and right, the other up and down. The eye sees the path.' },
  ],
  'projection-mapping': [
    { id: 'lens', kind: 'person', label: 'Stand at the projector', hint: 'From the lens it is one flat picture, cut to fit. Each solid gets its own part, and the gaps between them get black.' },
    { id: 'shapes', kind: 'detail', label: 'Go close to the shapes', hint: 'The shapes are plain white plaster. All the colour and pattern on them is light, cut to fit each face.' },
  ],
  // hall 5, paper
  'gyricon': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'Each bead turns its white half or its black half to you, so the sheet shows its picture by daylight alone.' },
    { id: 'beads', kind: 'detail', label: 'Go close to the beads', hint: 'Each bead is black on one half and white on the other, in its own pocket of oil. The field turns it, and it stays.' },
  ],
  'electrophoretic-ink': [
    { id: 'read', kind: 'person', label: 'Pick it up to read', hint: 'It reads by room light, like print. Watch a page change: every capsule goes black, then white, then to the new page.' },
    { id: 'page', kind: 'detail', label: 'Go close to the page', hint: 'When the page changes it flashes black and white. Then it holds the new page with no power at all.' },
  ],
  'cholesteric-lcd': [
    { id: 'slate', kind: 'person', label: 'Lean over the tablet', hint: 'Pressure flips the crystal to its reflecting state, and the stroke stays with no power. One pulse wipes the sheet.' },
    { id: 'stroke', kind: 'detail', label: 'Go close to the stroke', hint: 'Where the stylus pressed, the crystal reflects light, and the stroke stays with no power.' },
  ],
  'electrowetting': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'Coloured oil spread over a cell shows its colour. Pushed into a corner, it lets the white beneath show.' },
    { id: 'cells', kind: 'detail', label: 'Go close to the cells', hint: 'A film of dyed oil covers each cell. A voltage makes the water push the oil into a corner, and the cell clears.' },
  ],
  'interferometric-modulator': [
    { id: 'front', kind: 'person', label: "Stand in front", hint: "Colour without dye: each cell's colour is set by the height of the gap behind its glass." },
    { id: 'gaps', kind: 'detail', label: 'Look across the gaps', hint: 'A mirror on springs behind glass. The width of the gap picks the colour. Pulled against the glass, the cell is black.' },
  ],
  'electrochromic': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The figures and the window darken slowly as ions soak into their films, and they keep their state with no power.' },
    { id: 'label', kind: 'detail', label: 'Go close to the label', hint: 'Ions soak into the printed film and darken it. That takes seconds, not milliseconds, and then it holds with no power.' },
  ],
  // hall 6, mid-air
  'peppers-ghost': [
    { id: 'seat', kind: 'person', label: 'Sit down' },
    { id: 'pit', kind: 'detail', label: 'Look into the pit', hint: 'Below the front of the stage lies the lit figure. The sloping glass mirrors it, so it seems to stand on the stage.' },
  ],
  'fog-screen': [
    { id: 'fog', kind: 'person', label: 'Step up to the fog', hint: 'The picture hangs in falling fog, ragged by the time it reaches the floor. It is brightest facing the projector.' },
    { id: 'slot', kind: 'detail', label: 'Look up at the fog bar', hint: 'The fog falls from a thin slot between two curtains of air, which keep it flat enough to take a picture.' },
  ],
  'persistence-of-vision': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'Only one bar of LEDs is turning. Your eye joins its passes into a whole disc.' },
    { id: 'bar', kind: 'detail', label: 'Go close to the bar', hint: 'One bar of lamps, eighteen each side of the hub. Wait for it to slow down: the picture comes apart into a bar again.' },
  ],
  'swept-volume': [
    { id: 'round', kind: 'person', label: 'Walk round the dome', hint: 'The picture has real depth. From any side you see the side of it that faces you.' },
    { id: 'dome', kind: 'detail', label: 'Go close to the dome', hint: 'The points are inside the dome, not on it. Move round them: each is lit only as the spinning screen passes through it.' },
  ],
  'static-volume': [
    { id: 'sheets', kind: 'detail', label: 'Look along the sheets', hint: 'Twelve liquid crystal sheets. One at a time turns milky and catches its slice of the picture. The rest stay clear.' },
    { id: 'glass', kind: 'detail', label: 'Go close to the glass', hint: 'Three layers of glass, one for each colour. It glows only where the two beams cross, and that point draws the figure.' },
  ],
  'optical-trap': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'The figure is drawn by one speck, too small to see, dragged through the air in a laser beam.' },
    { id: 'speck', kind: 'detail', label: 'Go close to the speck', hint: 'One speck of cellulose, held in a laser beam and dragged round. Three small lasers colour it as it passes.' },
  ],
  'acoustic-levitation': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'Sound from the arrays above and below holds a bead in the air and throws it round the figure.' },
    { id: 'bead', kind: 'detail', label: 'Go close to the bead', hint: 'One bead, held by ultrasound from the arrays above and below, flown round the outline fast enough to be seen whole.' },
  ],
  'laser-plasma': [
    { id: 'front', kind: 'person', label: "Stand in front", hint: "Each dot of the picture is a flash of air turned to plasma at the laser's focus." },
    { id: 'points', kind: 'detail', label: 'Go close to the points', hint: 'Each point is air, flashing where the pulsed beam comes to a focus. Only one exists at a time. The rest is afterimage.' },
  ],
  // hall 7, depth
  'stereoscope': [
    { id: 'eyepiece', kind: 'person', label: 'Look in' },
    { id: 'card', kind: 'detail', label: 'Look at the card', hint: 'Two photographs taken a few centimetres apart. Compare the edges: near things have shifted more than far ones.' },
  ],
  'stereo-glasses': [
    { id: 'front', kind: 'person', label: 'Sit in front', hint: 'Every eight seconds the screen and the glasses change together: colour, then time, then polarised light.' },
    { id: 'table', kind: 'detail', label: 'Look at the glasses', hint: 'In the middle pair, the lenses clear and darken in turn, in step with the picture on the screen.' },
  ],
  'parallax-barrier': [
    { id: 'spot', kind: 'person', label: 'Stand in front', hint: 'Move your head. Through the slits, the columns for one eye give way to the columns for the other: L turns to R.' },
    { id: 'slits', kind: 'detail', label: 'Go close to the slits', hint: 'The mask stands off the screen on pillars. Through each slit one eye sees one column and the other eye the next.' },
  ],
  'lenticular': [
    { id: 'pass', kind: 'person', label: 'Walk past it', hint: 'Drag to walk past. Each rib shows the stripe that faces you, so the eye in the print follows you. There are nine views.' },
    { id: 'ribs', kind: 'detail', label: 'Go close to the ribs', hint: 'Each rib of plastic is a long, thin lens over thin stripes of the print, one stripe for each picture.' },
  ],
  'integral-imaging': [
    { id: 'round', kind: 'person', label: 'Look round it', hint: 'Move your head sideways, then up and down. The scene shifts both ways, in small steps: one view for each lens position.' },
    { id: 'lenses', kind: 'detail', label: 'Go close to the lenses', hint: 'Each tiny round lens shows its own part of the picture beneath it, so the view changes up and down as well as sideways.' },
  ],
  'holography': [
    { id: 'plate', kind: 'person', label: 'Look through the plate', hint: 'The toy engine is not behind the glass. Move your head: it turns as the real one would. Best with the daylight off.' },
    { id: 'bench', kind: 'detail', label: 'Look along the bench', hint: 'Laser, lens and plate stand in one line on a rail. The lens spreads the beam so that it lights the whole plate.' },
  ],
  'retinal-display': [
    { id: 'front', kind: 'person', label: 'Stand back from the eye', hint: 'There is no screen anywhere. One beam goes in through the pupil and the picture forms at the back of the eye.' },
    { id: 'retina', kind: 'detail', label: 'Look in at the retina', hint: 'There is no screen. The beam goes in through the pupil and paints the picture on the back wall of the eye, upside down.' },
  ],
  'head-mounted': [
    { id: 'worn', kind: 'person', label: 'Put it on' },
    { id: 'kit', kind: 'detail', label: "Look at one eye's parts", hint: "A lens and the small screen it looks at. The picture on the panel is drawn bulging, so that the lens shows it straight." },
  ],
  'cave': [
    { id: 'inside', kind: 'person', label: 'Take the figure\'s place', hint: 'Now the picture is drawn for your eye. The walls and floor join into one scene, and the corners vanish.' },
    { id: 'behind', kind: 'detail', label: 'Go behind the wall', hint: 'The projector throws its picture at a mirror, which folds it onto the back of the screen. Nobody inside casts a shadow.' },
  ],
  'head-up': [
    { id: 'seat', kind: 'person', label: 'Sit down' },
    { id: 'lens', kind: 'detail', label: 'Look down at the lens', hint: 'The lens below makes the light of each symbol parallel, so the glass shows the symbols as if they were far away.' },
  ],
  'colour-wheel-television': [
    { id: 'set', kind: 'person', label: "Sit in front of the set", hint: "At first the model runs slowly, so the red, green and blue pictures show one at a time. At speed they merge into one." },
    { id: 'wheel', kind: 'detail', label: "Go close to the wheel", hint: "Each filter passes in front of the black-and-white tube while the tube draws that colour's part of the picture." },
  ],
  'quantum-dot': [
    { id: 'screen', kind: 'person', label: 'Stand in front of the screen', hint: 'Behind the enlarged pixel stands the screen it belongs to. Its red and green are blue light changed by dots.' },
    { id: 'pixel', kind: 'detail', label: 'Go close to the pixel', hint: 'Blue lamps below. Large dots turn the blue red, small dots turn it green, and the third well lets the blue through.' },
  ],
  'illusion-transmitter': [
    { id: 'front', kind: 'person', label: 'Stand in front', hint: 'On the left a bulb seems to glow in an empty socket. On the right the same picture hangs in the air.' },
    { id: 'mirror', kind: 'detail', label: 'Look into the box', hint: 'The real bulb is hidden from you. The concave mirror at the back makes a picture of it that stands in the empty socket.' },
  ],
};

export const viewsOf = (pieceId: string): ViewInfo[] => views[pieceId] ?? [];
