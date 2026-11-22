import type { Built } from '../kit';
import * as h1 from './h1';
import * as h2 from './h2';
import * as h3 from './h3';
import * as h4 from './h4';
import * as h4b from './h4b';
import * as h5 from './h5';
import * as h6 from './h6';
import * as h7 from './h7';

/** One builder per piece id. CI fails if a piece in the data has no entry here. */
export const builders: Record<string, () => Built> = {
  'split-flap': h1.splitFlap,
  'flip-disc': h1.flipDisc,
  'mechanical-television': h1.nipkow,
  'kinetic-mirror': h1.kineticMirror,
  'shape-display': h1.shapeDisplay,
  'braille-display': h1.braille,
  'drone-show': h1.droneShow,
  'cathode-ray-tube': h2.crt,
  'colour-wheel-television': h2.colourWheel,
  'vector-display': h2.vector,
  'storage-tube': h2.storageTube,
  'nixie-tube': h2.nixie,
  'vacuum-fluorescent': h2.vfd,
  'numitron': h2.numitron,
  'plasma-panel': h2.plasma,
  'field-emission': h2.fed,
  'eggcrate': h2.eggcrate,
  'led-display': h3.led,
  'oled': h3.oled,
  'microled': h3.microled,
  'quantum-dot': h3.quantumDots,
  'thin-film-el': h3.tfel,
  'transparent-display': h3.transparent,
  'flexible-display': h3.flexible,
  'camera-obscura': h4b.cameraObscura,
  'shadow-play': h4b.shadowPlay,
  'liquid-crystal': h4.lcd,
  'micromirror': h4.dmd,
  'lcos': h4.lcos,
  'eidophor': h4.eidophor,
  'scanned-laser': h4.laserScan,
  'projection-mapping': h4.projectionMapping,
  'gyricon': h5.gyricon,
  'electrophoretic-ink': h5.eink,
  'cholesteric-lcd': h5.chlcd,
  'electrowetting': h5.electrowetting,
  'interferometric-modulator': h5.imod,
  'electrochromic': h5.electrochromic,
  'peppers-ghost': h6.peppersGhost,
  'fog-screen': h6.fogScreen,
  'illusion-transmitter': h6.illusionTransmitter,
  'persistence-of-vision': h6.pov,
  'swept-volume': h6.sweptVolume,
  'static-volume': h6.staticVolume,
  'optical-trap': h6.opticalTrap,
  'acoustic-levitation': h6.acousticLev,
  'laser-plasma': h6.laserPlasma,
  'stereoscope': h7.stereoscope,
  'parallax-barrier': h7.parallaxBarrier,
  'lenticular': h7.lenticular,
  'integral-imaging': h7.integral,
  'holography': h7.hologram,
  'head-mounted': h7.hmd,
  'retinal-display': h7.retinal,
  'head-up': h7.hud,
};
