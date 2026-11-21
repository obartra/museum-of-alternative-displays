import { THREE } from './kit';

/**
 * Depth for red and cyan paper glasses. The scene is drawn twice, from a left and a right eye a little apart, and the
 * two pictures are laid over each other so that each lens passes only its own.
 *
 * The mixing weights are Eric Dubois's least-squares set for red and cyan filters, which keeps more colour and less
 * ghosting than giving the left eye the red channel and the right eye the rest.
 */
export class Anaglyph {
  private eyes = new THREE.StereoCamera();
  private left: THREE.WebGLRenderTarget;
  private right: THREE.WebGLRenderTarget;
  private quad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private page = new THREE.Scene();
  private size = new THREE.Vector2();

  constructor(private renderer: THREE.WebGLRenderer, smooth = true) {
    const float = renderer.extensions.has('EXT_color_buffer_float') || renderer.extensions.has('EXT_color_buffer_half_float');
    // the stencil buffer is what lets a reflection show only inside its pane, as on the plain stage
    const make = () => new THREE.WebGLRenderTarget(4, 4, { type: float ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: true, stencilBuffer: true, samples: smooth ? 4 : 0 });
    this.left = make(); this.right = make();
    this.eyes.aspect = 1;
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      uniforms: { tLeft: { value: this.left.texture }, tRight: { value: this.right.texture } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      // each eye is brought to what the screen would show before the two are mixed: the weights are made for that
      fragmentShader: /* glsl */ `
        uniform sampler2D tLeft; uniform sampler2D tRight; varying vec2 vUv;
        vec3 shown(vec3 light) {
          #ifdef TONE_MAPPING
            light = toneMapping(light);
          #endif
          return linearToOutputTexel(vec4(light, 1.0)).rgb;
        }
        void main() {
          vec3 l = shown(texture2D(tLeft, vUv).rgb), r = shown(texture2D(tRight, vUv).rgb);
          mat3 forLeft = mat3(0.456100, -0.0400822, -0.0152161, 0.500484, -0.0378246, -0.0205971, 0.176381, -0.0157589, -0.00546856);
          mat3 forRight = mat3(-0.0434706, 0.378476, -0.0721527, -0.0879388, 0.73364, -0.112961, -0.00155529, -0.0184503, 1.2264);
          gl_FragColor = vec4(clamp(forLeft * l + forRight * r, 0.0, 1.0), 1.0);
        }`,
      depthTest: false, depthWrite: false,
    }));
    this.quad.frustumCulled = false;
    this.page.add(this.quad);
  }

  /**
   * Draw one frame. `focus` is how far away the thing being looked at is: it lands on the screen itself, with what is
   * nearer in front of the glass and the room behind it. `before` is told each eye in turn, for work that depends on
   * where the eye is, such as a mirror.
   */
  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, focus: number, before?: (eye: THREE.PerspectiveCamera) => void): void {
    const r = this.renderer;
    r.getDrawingBufferSize(this.size);
    if (this.left.width !== this.size.x || this.left.height !== this.size.y) { this.left.setSize(this.size.x, this.size.y); this.right.setSize(this.size.x, this.size.y); }
    const was = camera.focus;
    camera.focus = focus;
    // eyes a thirtieth of the distance apart: a comfortable depth on a hand-held screen, near or far
    this.eyes.eyeSep = THREE.MathUtils.clamp(focus / 30, 0.002, 0.3);
    if (scene.matrixWorldAutoUpdate) scene.updateMatrixWorld();
    if (camera.parent === null && camera.matrixWorldAutoUpdate) camera.updateMatrixWorld();
    this.eyes.update(camera);
    camera.focus = was;
    const target = r.getRenderTarget();
    for (const [eye, into] of [[this.eyes.cameraL, this.left], [this.eyes.cameraR, this.right]] as const) {
      before?.(eye);
      r.setRenderTarget(into);
      r.clear();
      r.render(scene, eye);
    }
    r.setRenderTarget(target);
    r.render(this.page, this.flat);
  }

  dispose(): void {
    this.left.dispose(); this.right.dispose();
    this.quad.geometry.dispose(); this.quad.material.dispose();
  }
}
