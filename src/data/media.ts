import { patentMedia } from './media-patents';

/** Archive pictures and film for a piece: real objects, period drawings, patent figures, the thing running. Each from an open archive, free to reuse. */
export interface MediaCredit {
  /** Who made it, as the source states it, in plain text. "Unknown" only when the source says so. */
  author: string;
  /** Short licence name: "Public domain", "CC0 1.0", "CC BY 4.0", "CC BY-SA 3.0", or "No known copyright restrictions" from an institution that says so. */
  licence: string;
  /** Link to the licence deed. Left out only for the public domain. */
  licenceUrl?: string;
  /** The page of this item at the archive that holds it. */
  source: string;
  /** The archive: "Wikimedia Commons" when left out, otherwise "Internet Archive", "NASA", "Google Patents" and so on. */
  archive?: string;
  /** The item's title there. For a Commons file, its name without the "File:" prefix. */
  title: string;
  /** What was done to it: "Resized", "Cropped and resized", "Cut to 12 seconds, sound removed, re-encoded". */
  changes: string;
}
export interface MediaBase {
  id: string;
  kind: 'photo' | 'drawing' | 'film';
  /** What it shows and why it is here. One or two sentences, at most 40 words. */
  caption: string;
  /** What is visible, for someone who cannot see it. At most 30 words. Not a repeat of the caption. */
  alt: string;
  /** When it was made, as the source gives it: "1862", "about 1930". Left out when the source does not say. */
  year?: string;
  /** Pixel size of the large file, or of the film. */
  width: number;
  height: number;
  credit: MediaCredit;
}
export interface Still extends MediaBase { kind: 'photo' | 'drawing'; small: string; large: string }
export interface Film extends MediaBase { kind: 'film'; mp4: string; webm: string; poster: string; seconds: number }
export type Media = Still | Film;

/** Photographs, engravings and films, most of them from Wikimedia Commons. */
const pictures: Record<string, Media[]> = {
  'split-flap': [
    {
      id: 'board-updating', kind: 'film',
      caption: 'A departure board at a German railway station, filmed in 2005. Rows of leaves turn over as the list of trains is brought up to date.',
      alt: 'A large dark board headed Abfahrt, Departure, with white lettering in many rows. Characters blur and change in several rows at once.',
      year: '2005',
      width: 640, height: 480,
      credit: {
        author: 'Runner1928',
        licence: 'CC0 1.0',
        licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Split-flap_display_at_German_train_station.webm',
        title: 'Split-flap display at German train station.webm',
        changes: 'Cut to 12 seconds, re-encoded',
      },
      mp4: './media/split-flap/board-updating.mp4', webm: './media/split-flap/board-updating.webm', poster: './media/split-flap/board-updating-poster.webp', seconds: 12,
    },
    {
      id: 'mechanism', kind: 'photo',
      caption: 'The works of a split-flap alarm clock, taken out of its case. A motor at the back turns the wheels of leaves, and the inset shows the metal tab that holds back the top leaf.',
      alt: 'A metal frame holding gears, two knobs and wheels of black leaves that read 11 00 in white. A round inset enlarges one corner of a leaf.',
      year: '2010',
      width: 1280, height: 881,
      credit: {
        author: 'Reinraum',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Split-flap_display.jpg',
        title: 'Split-flap display.jpg',
        changes: 'Resized',
      },
      small: './media/split-flap/mechanism-480.webp', large: './media/split-flap/mechanism-1280.webp',
    },
    {
      id: 'departures', kind: 'photo',
      caption: 'A split-flap departure board for the New Haven Line, photographed at Grand Central in 2014. Each row gives a time, a track, a destination and remarks.',
      alt: 'A wide black board under a stone wall, headed New Haven Line Departures, with five rows of white capital letters and numbers.',
      year: '2014',
      width: 1280, height: 853,
      credit: {
        author: 'Chris Sampson',
        licence: 'CC BY-SA 2.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/2.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Solari_board.jpg',
        title: 'Solari board.jpg',
        changes: 'Resized',
      },
      small: './media/split-flap/departures-480.webp', large: './media/split-flap/departures-1280.webp',
    },
  ],
  'flip-disc': [
    {
      id: 'slow-motion', kind: 'film',
      caption: 'A flip-disc display filmed in slow motion from a low angle. Discs turn over one after another, and the edge between the pale faces and the dark ones moves across the board.',
      alt: 'Oblique close view along a grid of square cells. Pale discs fill one side and dark ones the other, and single discs flick over at the edge between them.',
      year: '2016',
      width: 720, height: 406,
      credit: {
        author: 'Ubahnverleih',
        licence: 'CC0 1.0',
        licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Flip-dot-display_Slowmotion_video.webm',
        title: 'Flip-dot-display Slowmotion video.webm',
        changes: 'Cut to 11 seconds, sound removed, re-encoded',
      },
      mp4: './media/flip-disc/slow-motion.mp4', webm: './media/flip-disc/slow-motion.webm', poster: './media/flip-disc/slow-motion-poster.webp', seconds: 11,
    },
    {
      id: 'row', kind: 'photo',
      caption: 'A row of seven flip dots. Five show their yellow face, one has turned to black, and the disc of the seventh has been lifted out and lies above the row.',
      alt: 'Seven black plastic holders in a line on a white ground, each on two green coils with wire legs. Yellow discs sit in five, a black one in the last.',
      year: '2016',
      width: 1280, height: 677,
      credit: {
        author: 'Make Magazin DE',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Flipdotrow.jpg',
        title: 'Flipdotrow.jpg',
        changes: 'Resized',
      },
      small: './media/flip-disc/row-480.webp', large: './media/flip-disc/row-1280.webp',
    },
    {
      id: 'coils', kind: 'photo',
      caption: 'A flip-dot matrix seen edge on. Copper coils stand on the circuit board beneath the white discs, a set for every dot.',
      alt: 'Side view of a green circuit board carrying rows of small copper wire coils on posts, with flat white discs resting on black frames above them.',
      year: '2016',
      width: 960, height: 489,
      credit: {
        author: 'Make Magazin DE',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Flipdot_array_white.jpg',
        title: 'Flipdot array white.jpg',
        changes: 'Resized',
      },
      small: './media/flip-disc/coils-480.webp', large: './media/flip-disc/coils-1280.webp',
    },
  ],
  'mechanical-television': [
    {
      id: 'receiver', kind: 'photo',
      caption: 'A mechanical television receiver from the 1930s at the Tekniska museet. The picture behind the disc was about three centimetres square, so it was watched through the magnifying lenses.',
      alt: 'A black cabinet with dials, switches and a meter. Above it a large dark disc stands on edge, with round glass lenses mounted in front of it.',
      year: '2012',
      width: 1134, height: 1280,
      credit: {
        author: 'Holger.Ellgaard',
        licence: 'CC BY-SA 3.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Nipkows_apparat_Tekniska_museet.jpg',
        title: 'Nipkows apparat Tekniska museet.jpg',
        changes: 'Resized',
      },
      small: './media/mechanical-television/receiver-480.webp', large: './media/mechanical-television/receiver-1280.webp',
    },
    {
      id: 'system-1928', kind: 'drawing',
      caption: 'A diagram from Radio News, April 1928. At the transmitter a scanning disc and photoelectric cells turn a face into a signal. At the receiver a neon lamp and a second disc rebuild it for the viewer.',
      alt: 'Labelled line drawing: arc light, disc and photoelectric cells facing a head in profile, radio masts, then a neon lamp, disc and lens before a second head.',
      year: '1928',
      width: 960, height: 525,
      credit: {
        author: 'C. G. B. Rowe',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Early_Television_System_Diagram.png',
        title: 'Early Television System Diagram.png',
        changes: 'Resized',
      },
      small: './media/mechanical-television/system-1928-480.webp', large: './media/mechanical-television/system-1928-1280.webp',
    },
  ],
  'nixie-tube': [
    {
      id: 'lit-and-unlit', kind: 'photo',
      caption: 'Two Soviet IN-18 tubes beside a matchbox for scale. One is lit. In the other the whole stack of thin metal numerals can be seen through the mesh.',
      alt: 'Two glass tubes lying on a wooden table next to a matchbox. The upper one glows orange with a numeral. The lower is unlit, showing fine overlapping metal numerals.',
      year: '2011',
      width: 1280, height: 960,
      credit: {
        author: 'Gavryuha',
        licence: 'CC0 1.0',
        licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        source: 'https://commons.wikimedia.org/wiki/File:IN18.JPG',
        title: 'IN18.JPG',
        changes: 'Resized',
      },
      small: './media/nixie-tube/lit-and-unlit-480.webp', large: './media/nixie-tube/lit-and-unlit-1280.webp',
    },
    {
      id: 'inside', kind: 'photo',
      caption: 'A Nixie tube opened up. The numerals are separate thin metal shapes stacked one behind another, with a screen of fine mesh around them.',
      alt: 'Close view of thin pale metal numerals layered on top of each other inside a round mesh cup, standing on a green circuit board.',
      year: '2014',
      width: 1280, height: 1254,
      credit: {
        author: 'Sergei Frolov, Soviet Digital Electronics Museum',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Inside_the_nixie_tube_vnutri_u_nei_neonka.jpg',
        title: 'Inside the nixie tube vnutri u nei neonka.jpg',
        changes: 'Resized',
      },
      small: './media/nixie-tube/inside-480.webp', large: './media/nixie-tube/inside-1280.webp',
    },
    {
      id: 'glow', kind: 'photo',
      caption: 'The glow inside a working Nixie tube, seen through the honeycomb mesh at the front. The light is a thin sheath of glowing neon that clings to the metal of the numeral.',
      alt: 'Extreme close-up of a curved orange band of light behind a hexagonal metal grid, with a second glowing shape out of focus at the left.',
      year: '2016',
      width: 1280, height: 853,
      credit: {
        author: 'Maxim Bilovitskiy',
        licence: 'CC BY 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Neon_glow.jpg',
        title: 'Neon glow.jpg',
        changes: 'Resized',
      },
      small: './media/nixie-tube/glow-480.webp', large: './media/nixie-tube/glow-1280.webp',
    },
  ],
  'cathode-ray-tube': [
    {
      id: 'braun-tube', kind: 'photo',
      caption: 'Ferdinand Braun\'s cathode ray tube of 1897 on its stand, as printed in a 1921 handbook of wireless telegraphy. The beam ran from the cathode in the narrow end to the screen in the wide one.',
      alt: 'Old printed photograph of a long glass tube lying horizontally on two supports above a baseboard. One end is a wide cylinder, the other a thin neck.',
      year: '1921',
      width: 960, height: 377,
      credit: {
        author: 'Eugen Nesper',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Braun_cathode_ray_tube_on_stand.jpg',
        title: 'Braun cathode ray tube on stand.jpg',
        changes: 'Resized',
      },
      small: './media/cathode-ray-tube/braun-tube-480.webp', large: './media/cathode-ray-tube/braun-tube-1280.webp',
    },
    {
      id: 'tube-and-coils', kind: 'photo',
      caption: 'A small picture tube out of its set, with the deflection coils still on its neck. The coils bend the beam so that it sweeps the whole face.',
      alt: 'A glass picture tube lying on a white surface, its grey rectangular screen toward the camera and a ring of copper windings around the narrow neck behind.',
      year: '2019',
      width: 1280, height: 1280,
      credit: {
        author: 'Raimond Spekking',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Mini_Star_416_-_cathode_ray_tube_with_deflection_coils-2212.jpg',
        title: 'Mini Star 416 - cathode ray tube with deflection coils-2212.jpg',
        changes: 'Resized',
      },
      small: './media/cathode-ray-tube/tube-and-coils-480.webp', large: './media/cathode-ray-tube/tube-and-coils-1280.webp',
    },
    {
      id: 'electron-gun', kind: 'photo',
      caption: 'The electron gun in the neck of an oscilloscope tube made in Hungary in the 1970s. The pins at the end carry its connections through the glass.',
      alt: 'The clear glass neck of a tube, seen at an angle. Inside are stacked metal cylinders, plates and fine wires, and a ring of gold pins leaves the end.',
      year: '2023',
      width: 1280, height: 1046,
      credit: {
        author: 'Mister rf',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:D13-27_GH_%CC%A0_T_Oscilloscope_CRT_04.jpg',
        title: 'D13-27 GH ̠ T Oscilloscope CRT 04.jpg',
        changes: 'Resized',
      },
      small: './media/cathode-ray-tube/electron-gun-480.webp', large: './media/cathode-ray-tube/electron-gun-1280.webp',
    },
  ],
  'eidophor': [
    {
      id: 'prototype', kind: 'photo',
      caption: 'The second prototype of the Eidophor large-screen television projector, about 1948. The ETH library\'s record lists the picture tube, the Eidophor cassette, the schlieren optics, a high-vacuum pump and a cooling machine.',
      alt: 'Black and white photograph of a machine filling a room: racks of electronics at the left, pipes, pumps and gauges at the right, a tall column in the middle.',
      year: 'about 1948',
      width: 1280, height: 928,
      credit: {
        author: 'Unknown (ETH-Bibliothek Zürich, Bildarchiv)',
        licence: 'CC BY-SA 4.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        source: 'https://commons.wikimedia.org/wiki/File:ETH-BIB-Zweiter_Prototyp_des_Eidophor-Fernsehgrossprojektors-Ans_04405.tif',
        title: 'ETH-BIB-Zweiter Prototyp des Eidophor-Fernsehgrossprojektors-Ans 04405.tif',
        changes: 'Resized',
      },
      small: './media/eidophor/prototype-480.webp', large: './media/eidophor/prototype-1280.webp',
    },
    {
      id: 'mission-control', kind: 'photo',
      caption: 'Mission control in Houston on 22 July 1969, during the return of Apollo 11. The file page identifies the large picture at the front of the room as an Eidophor display.',
      alt: 'A dim control room. Flight controllers seen from behind sit at consoles with small screens, facing a wall where a large projected picture shows figures on the Moon.',
      year: '1969',
      width: 816, height: 1280,
      credit: {
        author: 'NASA',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Eidophor_display_Mission_Control_Center_Houston.jpg',
        title: 'Eidophor display Mission Control Center Houston.jpg',
        changes: 'Resized',
      },
      small: './media/eidophor/mission-control-480.webp', large: './media/eidophor/mission-control-1280.webp',
    },
    {
      id: 'machine', kind: 'photo',
      caption: 'An Eidophor projector with its power supply and its projection lens, seen from the side. One panel is open on the works inside.',
      alt: 'A tall blue-grey cabinet marked Eidophor, with a control panel of switches and meters, an open compartment, and a large black lens barrel at floor level.',
      year: '2024',
      width: 964, height: 1280,
      credit: {
        author: 'Gamerakel',
        licence: 'CC0 1.0',
        licenceUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
        source: 'https://commons.wikimedia.org/wiki/File:EIDOPHOR_with_power_supply_and_lens.jpg',
        title: 'EIDOPHOR with power supply and lens.jpg',
        changes: 'Resized',
      },
      small: './media/eidophor/machine-480.webp', large: './media/eidophor/machine-1280.webp',
    },
  ],
  'peppers-ghost': [
    {
      id: 'stage-1865', kind: 'drawing',
      caption: 'The stage arrangement for Pepper\'s ghost, from Le Monde Illustré of 21 January 1865. A figure in white below the stage, lit by a lamp, is reflected in a tilted sheet of glass and appears beside the actor.',
      alt: 'Engraving in cross-section: an audience, a sloping pane of glass, an actor facing a pale figure on stage, under the stage a man aiming a lantern at a draped figure.',
      year: '1865',
      width: 1100, height: 1004,
      credit: {
        author: 'Bertrand (no first name given), Le Monde Illustré',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Peppers_Ghost.jpg',
        title: 'Peppers Ghost.jpg',
        changes: 'Resized',
      },
      small: './media/peppers-ghost/stage-1865-480.webp', large: './media/peppers-ghost/stage-1865-1280.webp',
    },
  ],
  'persistence-of-vision': [
    {
      id: 'disc', kind: 'photo',
      caption: 'A paper phenakistiscope disc of about 1830. Spun and watched through its ten slots, the drawings merge into a cat leaping over a stool and a donkey moving its ears.',
      alt: 'A round cream card with a ring of ten slots near the edge. Around it run small coloured drawings of cats and stools, and an inner ring of donkey heads.',
      year: 'about 1830',
      width: 1280, height: 1256,
      credit: {
        author: 'Unknown artist',
        licence: 'Public domain',
        source: 'https://commons.wikimedia.org/wiki/File:Optical_Toy,_Phenakistiscope_Disc_with_Cats_and_Donkey,_ca._1830_(CH_18607981).jpg',
        title: 'Optical Toy, Phenakistiscope Disc with Cats and Donkey, ca. 1830 (CH 18607981).jpg',
        changes: 'Resized',
      },
      small: './media/persistence-of-vision/disc-480.webp', large: './media/persistence-of-vision/disc-1280.webp',
    },
    {
      id: 'mirror-viewing', kind: 'drawing',
      caption: 'How a phenakistiscope was used, from Gaston Tissandier\'s Les récréations scientifiques, 1884. The viewer holds the spinning disc up to a mirror and looks through its slots at the reflection.',
      alt: 'Engraving of a man in profile holding a slotted disc on a handle to his eye. A mirror before him reflects the pictured side of the disc and his hands.',
      year: '1884',
      width: 960, height: 610,
      credit: {
        author: 'Camille Gilbert, engraved by E. A. Tilly',
        licence: 'CC BY-SA 3.0',
        licenceUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        source: 'https://commons.wikimedia.org/wiki/File:Der_Gebrauch_des_Spiegel-Phenakistiskops.jpg',
        title: 'Der Gebrauch des Spiegel-Phenakistiskops.jpg',
        changes: 'Resized',
      },
      small: './media/persistence-of-vision/mirror-viewing-480.webp', large: './media/persistence-of-vision/mirror-viewing-1280.webp',
    },
  ],
};

/** Everything a piece has in the archive: its photographs and films first, then its patent drawings. */
export const media: Record<string, Media[]> = Object.fromEntries(
  [...new Set([...Object.keys(pictures), ...Object.keys(patentMedia)])].map((id) => [id, [...(pictures[id] ?? []), ...(patentMedia[id] ?? [])]]),
);
