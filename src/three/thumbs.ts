import { Stage } from './stage';
import { builders } from './models';

let stage: Stage | null = null;
const cache = new Map<string, string>();
let chain: Promise<unknown> = Promise.resolve();
const idle = (fn: () => void) => ('requestIdleCallback' in window ? window.requestIdleCallback(fn, { timeout: 400 }) : setTimeout(fn, 16));

/** A view other than the opening one, for checking models: through the eyepiece, or from any angle. */
export interface Shot { eye?: boolean; az?: number; el?: number; zoom?: number }

/** A still of a piece on its plinth, rendered once and kept. One at a time, so the page stays responsive. */
export function thumb(id: string, hallColour: string, lightsOn: boolean, size = 420, shot?: Shot): Promise<string> {
  const key = `${id}|${lightsOn}`;
  const hit = shot ? undefined : cache.get(key);
  if (hit) return Promise.resolve(hit);
  const job = chain.then(() => new Promise<string>((resolve) => {
    idle(() => {
      try {
        if (!stage) { const c = document.createElement('canvas'); stage = new Stage(c, false); stage.resize(size, size); }
        const make = builders[id];
        if (!make) return resolve('');
        stage.setPiece(make(), hallColour);
        stage.setLights(lightsOn, true);
        if (shot?.eye) stage.goEye();
        else if (shot?.az !== undefined) stage.goTo(shot.az, shot.el ?? 10, shot.zoom ?? 1);
        const url = stage.snapshot();
        if (!shot) cache.set(key, url);
        resolve(url);
      } catch (err) {
        console.error('thumbnail failed for', id, err);
        resolve('');
      }
    });
  }));
  chain = job.catch(() => undefined);
  return job;
}
