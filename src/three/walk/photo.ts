import { halls } from '../../data/halls';
import { pieces } from '../../data/pieces';
import { THREE } from '../kit';
import { builders } from '../models';
import { Gallery, type GalleryOptions } from './gallery';
import * as plan from './plan';
import { CARD, SHEET, VIEWS, cutout, seat, shed } from './stands';

/**
 * The workshop behind the walk, not a part of the museum: `scripts/cutouts.mjs` opens it and saves what it makes.
 *
 * It photographs the pictures that stand in for the pieces a visitor is not near. Each piece is set on its own
 * block in the hall, lit as it is lit there, and photographed alone from the three sides it is seen from:
 * once against black, which gives its colour, and once against grey, which shows how much of the grey it hides.
 * It also takes the still picture of the hall that the page shows before the hall itself has started.
 */

/** One side of a piece, in the piece's own file: this many dots wide and high, with the cover the same size beside it. */
const W = 512, H = 384;
/** Each side is drawn this many times larger and reduced, which is smoother than drawing it small. */
const OVER = 2;
/** The same in the sheet of small pictures. */
const SW = 128, SH = 96;
/** How bright the grey is, of 255. */
const GREY = 128;

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const options = (lights: boolean): GalleryOptions => ({
  lights, lite: false, calm: true, fixed: true,
  signs: halls.map((h) => ({ no: h.id, name: h.name, ground: css(`--h${h.id}`), ink: h.id === 4 || h.id === 5 ? '#14171a' : '#ffffff' })),
  names: Object.fromEntries(pieces.map((p) => [p.id, p.name])),
  display: css('--display'),
  onWhere: () => undefined, onOpen: () => undefined, onRelease: () => undefined, onTouch: () => undefined,
});
const pad = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true })!;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  return [c, g];
};

let studio: Gallery | undefined;
/** The hall the pieces are photographed in. It is never shown: only its lights, its shadows and its blocks are wanted. */
function hall(): Gallery {
  if (studio) return studio;
  studio = new Gallery(document.createElement('canvas'), options(true));
  return studio;
}

/**
 * One piece, by day or by night: its three sides one under another, each with its cover beside it, as a WebP in a data address.
 * With it, the colour the piece throws round it in the dark, if it glows.
 */
export async function shoot(id: string, day: boolean): Promise<[string, number | null]> {
  const g = hall(), p = plan.placeOf(id), make = builders[id];
  if (!p || !make) throw new Error(`no such piece: ${id}`);
  // the land outside is painted over several frames: a piece that shows the view, like the camera obscura, waits for it
  await g.hall.ready;
  const L = day ? 1 : 0, r = g.renderer, anchor = g.stands.models.children[p.no];
  const b = make();
  seat(b);
  anchor.add(b.root);
  anchor.updateMatrixWorld(true);

  // what is not the piece: the building, the land outside, the blocks. The lamps stay, so that no shader is built twice
  const rest = [...g.hall.group.children, ...g.stands.group.children].filter((o) => !(o as THREE.Light).isLight && o !== g.hall.sun.target);
  const show = (on: boolean) => { for (const o of rest) o.visible = on; };
  const was = rest.map((o) => o.visible);

  // the eye of someone standing in the hall, and a picture plane that stays upright: the card over the block, as seen from there
  const eyeY = plan.FLOOR + plan.EYE, near = 1, k = near / CARD.back;
  const cam = new THREE.PerspectiveCamera();
  cam.projectionMatrix.makePerspective((-CARD.w / 2) * k, (CARD.w / 2) * k, (CARD.y0 + CARD.h - eyeY) * k, (CARD.y0 - eyeY) * k, near, 80);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();

  const ground = g.scene.background as THREE.Color;
  const [out, ox] = pad(2 * W, H * VIEWS.length), [, dx] = pad(W, H), [, px] = pad(W, H);
  g.hall.light(L, g.scene);
  try {
    VIEWS.forEach((turn, view) => {
      cam.position.set(Math.sin(turn) * CARD.back, eyeY, Math.cos(turn) * CARD.back).applyMatrix4(anchor.matrixWorld);
      cam.lookAt(p.x, eyeY, p.z);
      cam.updateMatrixWorld(true);
      b.update?.({ t: 2.6, lights: L, camera: cam });
      // the shadows as they fall in the hall, with everything in its place. The picture this draws is not kept, so it is drawn small
      show(true);
      r.setPixelRatio(1); r.setSize(32, 24, false);
      r.shadowMap.needsUpdate = true;
      r.render(g.scene, cam);
      // then the piece alone, against black and against grey
      show(false);
      r.setSize(W * OVER, H * OVER, false);
      ground.setRGB(0, 0, 0); r.render(g.scene, cam);
      dx.clearRect(0, 0, W, H); dx.drawImage(r.domElement, 0, 0, W, H);
      ground.setRGB(GREY / 255, GREY / 255, GREY / 255, THREE.SRGBColorSpace); r.render(g.scene, cam);
      px.clearRect(0, 0, W, H); px.drawImage(r.domElement, 0, 0, W, H);
      // where the grey still shows, nothing is hidden. Light that a piece adds to what is behind it hides nothing either
      const a = dx.getImageData(0, 0, W, H), c = px.getImageData(0, 0, W, H), cover = ox.createImageData(W, H);
      for (let i = 0; i < a.data.length; i += 4) {
        const through = Math.max(c.data[i] - a.data[i], c.data[i + 1] - a.data[i + 1], c.data[i + 2] - a.data[i + 2]);
        const hides = Math.round(255 * Math.min(1, Math.max(0, 1 - through / GREY)));
        cover.data[i] = cover.data[i + 1] = cover.data[i + 2] = hides; cover.data[i + 3] = 255;
      }
      ox.putImageData(a, 0, view * H);
      ox.putImageData(cover, W, view * H);
    });
  } finally {
    rest.forEach((o, i) => { o.visible = was[i]; });
    anchor.remove(b.root);
    shed(b.root);
  }
  // one turn of the page between pieces, so that the browser can let go of what the last one used
  await new Promise((done) => setTimeout(done, 0));
  return [out.toDataURL('image/webp', 0.9), b.glow ?? null];
}

/** The sheet of small pictures for day or for night, made from the pieces' own files as they are now on disk. */
export async function sheet(day: boolean): Promise<string> {
  const n = VIEWS.length, [out, ox] = pad(SHEET.cols * 2 * SW, SHEET.rows * n * SH);
  ox.fillStyle = '#000'; ox.fillRect(0, 0, out.width, out.height);
  await Promise.all(plan.places.map(async (p) => {
    const img = new Image();
    img.src = `${cutout(p.id, day)}?${Date.now()}`;
    await img.decode();
    if (img.naturalWidth !== 2 * W || img.naturalHeight !== n * H) throw new Error(`${p.id}: its picture is ${img.naturalWidth} by ${img.naturalHeight}`);
    for (let view = 0; view < n; view++) ox.drawImage(img, 0, view * H, 2 * W, H, (p.no % SHEET.cols) * 2 * SW, (view * SHEET.rows + Math.floor(p.no / SHEET.cols)) * SH, 2 * SW, SH);
  }));
  return out.toDataURL('image/webp', 0.9);
}

/** The hall from the door, as it stands when a visitor arrives: the picture the page shows first. Two sizes. */
export async function still(day: boolean, w = 1600, h = 900): Promise<[string, string]> {
  const box = document.createElement('div');
  box.style.cssText = `position:fixed;left:0;top:0;width:${w}px;height:${h}px;opacity:0;pointer-events:none`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'display:block;width:100%;height:100%';
  box.append(canvas); document.body.append(box);
  const g = new Gallery(canvas, options(day));
  try {
    await g.hall.ready;
    // wait for the models nearest the door, and for the pictures of everything else, to arrive and settle
    let same = 0, last = '';
    for (let i = 0; i < 6000 && same < 50; i++) {
      g.step(0.05, true);
      const c = g.stands.count, now = `${c.live}/${c.making}/${c.pictured}`;
      same = now === last && !c.making && c.live > 0 && c.pictured === plan.places.length ? same + 1 : 0;
      last = now;
      await new Promise((done) => setTimeout(done, 25));
    }
    g.step(0.05, true);
    // a browser that draws in software sometimes drops the picture altogether: say so, and let the script try again
    if (g.renderer.getContext().isContextLost()) throw new Error('the graphics context was lost');
    const big = canvas.toDataURL('image/webp', 0.86);
    const [half, hx] = pad(w / 2, h / 2);
    hx.drawImage(canvas, 0, 0, w / 2, h / 2);
    return [big, half.toDataURL('image/webp', 0.84)];
  } finally {
    g.dispose(); box.remove();
  }
}

/** The page of the workshop: it says what it can do and waits to be told. */
export function workshop(app: HTMLElement): void {
  app.innerHTML = '<p style="padding:24px;font:16px/1.5 system-ui">The workshop of the walk. <code>scripts/cutouts.mjs</code> drives this page and saves the pictures it makes.</p>';
  Object.assign(window, { cutouts: { ids: plan.places.map((p) => p.id), shoot, sheet, still } });
  document.body.dataset.ready = '1';
}
