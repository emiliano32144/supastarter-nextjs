'use client';
import { useEffect, useRef } from 'react';

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    let mounted = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function init() {
      if (!canvas || !mounted) return;

      const [THREE, { EffectComposer }, { RenderPass }, { ShaderPass }, { createNoise3D }] =
        await Promise.all([
          import('three'),
          import('three/examples/jsm/postprocessing/EffectComposer.js'),
          import('three/examples/jsm/postprocessing/RenderPass.js'),
          import('three/examples/jsm/postprocessing/ShaderPass.js'),
          import('simplex-noise'),
        ]);

      if (!mounted) return;

      const TEXT = 'FILO';
      const SIZE = 320;
      const PARTICLE_COUNT = 9000;
      const U_SCALE = 1.0;
      const U_SPEED = 0.2;
      const U_SIZE = 0.9;
      const U_HUE = 0.0;
      const CURSOR_RADIUS = 0.15;
      const CURSOR_STRENGTH = 0.5;
      const FREQUENCY = 0.0015;
      const FRICTION = 0.95;
      const BROWNIAN_STR = 0.002;
      const FLOW_STR = 0.1;
      const SEEK_FORCE = 0.02;
      const MAX_VEL = 0.05;
      const EXPLODE_RADIUS = 0.5;
      const EXPLODE_FORCE = 0.2;
      const COMEBACK_KICK = 0.1;
      const COMEBACK_SEEK = 0.05;
      const BG_COLOR = '#0a0a0a';

      function createTextCoordinates() {
        const c = document.createElement('canvas');
        c.width = SIZE; c.height = SIZE;
        const ctx2 = c.getContext('2d')!;
        ctx2.clearRect(0, 0, SIZE, SIZE);
        ctx2.fillStyle = '#ffffff';
        ctx2.font = '900 200px sans-serif';
        ctx2.textAlign = 'center';
        ctx2.textBaseline = 'middle';
        ctx2.fillText(TEXT, SIZE / 2, SIZE / 2);
        const imageData = ctx2.getImageData(0, 0, SIZE, SIZE);
        const data = imageData.data;
        const coords: { x: number; y: number }[] = [];
        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const i = (y * SIZE + x) * 4;
            if (data[i + 3] > 128) {
              coords.push({ x: (x / SIZE) * 2 - 1, y: -(y / SIZE) * 2 + 1 });
            }
          }
        }
        return coords;
      }

      const coords = createTextCoordinates();
      if (!coords.length || !mounted) return;

      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
      renderer.setClearColor(new THREE.Color(BG_COLOR), 1);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const scene = new THREE.Scene();
      const bgScene = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
      camera.position.z = 10;
      const bgCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const bgMat = new THREE.ShaderMaterial({
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
        fragmentShader: `
          uniform float uTime; uniform vec2 uViewportRes; varying vec2 vUv;
          vec3 generateRay(vec2 cv, vec2 size, float z) { vec2 p = cv / size - 0.5; p.x *= size.x / size.y; return normalize(vec3(p.x, p.y, z)); }
          float marchRay(vec3 ori, vec3 dir, float t) { float d = 1.0; vec3 p = ori; float acc = 0.0; float tw = 0.0; for (int i = 0; i < 64; i++) { float w = 1.0 / d; acc += w * (sin(p.x * p.z * 0.3 + t) + 1.0) * 0.5; tw += w; p += dir * d * 0.5; d += d * 0.5; } return acc / tw; }
          void main() { float t = uTime * 0.3; vec3 ori = vec3(0.0, 0.0, -10.0); vec3 dir = generateRay(gl_FragCoord.xy, uViewportRes, 0.3); float c = marchRay(ori, dir, t); vec3 bgColor = vec3(0.039, 0.039, 0.039); vec3 rayColor = vec3(0.83, 0.69, 0.22) * c * 0.12; gl_FragColor = vec4(bgColor + rayColor, 1.0); }
        `,
        uniforms: {
          uTime: { value: 0 },
          uViewportRes: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        },
        depthWrite: false,
      });
      const bgQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
      bgScene.add(bgQuad);

      const noise3D = createNoise3D();
      const total = PARTICLE_COUNT;
      const posArr = new Float32Array(total * 3);
      const velArr = new Float32Array(total * 3);
      const origArr = new Float32Array(total * 3);
      const seedArr = new Float32Array(total * 3);
      const mouse = new THREE.Vector2(-999, -999);

      for (let i = 0; i < total; i++) {
        const ci = i % coords.length;
        const ox = coords[ci].x * U_SCALE;
        const oy = coords[ci].y * U_SCALE;
        origArr[i*3] = ox; origArr[i*3+1] = oy; origArr[i*3+2] = 0;
        posArr[i*3] = ox + (Math.random()-0.5)*0.3; posArr[i*3+1] = oy + (Math.random()-0.5)*0.3; posArr[i*3+2] = 0;
        seedArr[i*3] = Math.random()-0.5; seedArr[i*3+1] = Math.random()-0.5; seedArr[i*3+2] = Math.random()*0.5;
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0]), 3));
      geom.setAttribute('aSeed', new THREE.BufferAttribute(seedArr, 3));
      geom.setAttribute('aPos', new THREE.BufferAttribute(origArr.slice(), 3));

      const mat = new THREE.ShaderMaterial({
        vertexShader: `attribute vec3 aSeed; attribute vec2 aPos; uniform float uTime; uniform float uSize; varying vec3 vColor; void main() { vColor = aSeed; vec3 p = position; p.xy += aPos; vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = uSize * (300.0 / -mv.z); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform float uHue; uniform float uTime; varying vec3 vColor; vec3 hsv2rgb(vec3 c) { vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0); vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www); return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y); } void main() { vec2 uv = gl_PointCoord.xy - 0.5; float l = length(uv); float o = 1.0 - smoothstep(0.0, 0.5, l); if (o < 0.01) discard; gl_FragColor = vec4(vec3(1.0), o * 0.85); }`,
        uniforms: { uTime: { value: 0 }, uHue: { value: U_HUE }, uSize: { value: U_SIZE } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });

      const mesh = new THREE.Points(geom, mat);
      scene.add(mesh);

      const vignetteShader = {
        uniforms: { tDiffuse: { value: null }, offset: { value: 1.0 }, darkness: { value: 1.2 } },
        vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform sampler2D tDiffuse; uniform float offset; uniform float darkness; varying vec2 vUv; void main() { vec4 texel = texture2D(tDiffuse, vUv); vec2 uv = (vUv - 0.5) * 2.0; float vig = 1.0 - dot(uv * 0.5, uv * 0.5); vig = smoothstep(0.0, 1.0, vig); gl_FragColor = vec4(texel.rgb * (vig * 0.6 + 0.4), texel.a); }`,
      };

      const composer = new EffectComposer(renderer);
      composer.setSize(window.innerWidth, window.innerHeight);
      composer.addPass(new RenderPass(scene, camera));
      composer.addPass(new ShaderPass(vignetteShader));

      const onMouseMove = (e: MouseEvent) => {
        const rect = canvas!.getBoundingClientRect();
        mouse.set(((e.clientX - rect.left) / rect.width) * 2 * 5 - 5, -(((e.clientY - rect.top) / rect.height) * 2 - 1) * 5);
      };
      const onResize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        bgMat.uniforms.uViewportRes.value.set(window.innerWidth, window.innerHeight);
      };
      canvas!.addEventListener('mousemove', onMouseMove);
      window.addEventListener('resize', onResize);

      const aPos = geom.attributes.aPos as THREE.BufferAttribute;
      const aPosArr = aPos.array as Float32Array;
      const pos = posArr;
      const vel = velArr;
      const orig = origArr;

      const animate = () => {
        if (!mounted) return;
        animRef.current = requestAnimationFrame(animate);
        const time = performance.now() * 0.001;
        bgMat.uniforms.uTime.value = time;
        (mat.uniforms.uTime as { value: number }).value = time;

        for (let i = 0; i < total; i++) {
          const ix = i*3, iy = i*3+1;
          let px = pos[ix], py = pos[iy], vx = vel[ix], vy = vel[iy];
          const bNoise = noise3D(px, py, seedArr[ix]+3) * 0.01;
          vx += Math.cos(bNoise) * BROWNIAN_STR; vy += Math.sin(bNoise) * BROWNIAN_STR;
          vx *= FRICTION; vy *= FRICTION;
          const nVal = noise3D(px*FREQUENCY, py*FREQUENCY, time*0.1*U_SPEED+seedArr[ix]) * Math.PI * 2;
          vx += Math.cos(nVal) * FLOW_STR * U_SPEED; vy += Math.sin(nVal) * FLOW_STR * U_SPEED;
          const mdx = px - mouse.x, mdy = py - mouse.y;
          const mDist = Math.sqrt(mdx*mdx + mdy*mdy);
          if (mDist < CURSOR_RADIUS && mDist > 0.0001) {
            const force = (CURSOR_RADIUS - mDist) / CURSOR_RADIUS;
            const angle = Math.atan2(mdy, mdx);
            vx += Math.cos(angle)*force*CURSOR_STRENGTH; vy += Math.sin(angle)*force*CURSOR_STRENGTH;
          }
          const sx = orig[ix]-px, sy = orig[iy]-py;
          const sDist = Math.sqrt(sx*sx + sy*sy);
          if (sDist > 0.001) { vx += (sx/sDist)*SEEK_FORCE; vy += (sy/sDist)*SEEK_FORCE; }
          const vMag = Math.sqrt(vx*vx + vy*vy);
          if (vMag > MAX_VEL) { vx = (vx/vMag)*MAX_VEL; vy = (vy/vMag)*MAX_VEL; }
          pos[ix] = px+vx; pos[iy] = py+vy; vel[ix] = vx; vel[iy] = vy;
          aPosArr[ix] = pos[ix]; aPosArr[iy] = pos[iy];
        }
        aPos.needsUpdate = true;

        renderer.autoClear = true;
        renderer.render(bgScene, bgCamera);
        renderer.autoClear = false;
        composer.render();
      };
      animate();

      return () => {
        canvas!.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        composer.dispose();
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((fn) => { cleanup = fn; });

    return () => {
      mounted = false;
      cancelAnimationFrame(animRef.current);
      cleanup?.();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Partículas animadas FILO"
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, display: 'block' }}
    />
  );
}
