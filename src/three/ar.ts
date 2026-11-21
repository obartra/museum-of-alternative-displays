import type { THREE } from './kit';

/**
 * A piece in the visitor's own room, through the camera of a phone or a headset.
 * The page calls this with the model that is on the stand. It resolves when the room view has opened or closed,
 * and rejects with a reason when the device cannot do it.
 */
export async function showInRoom(_piece: THREE.Object3D, _name: string): Promise<void> {
  throw new Error('not built yet');
}
