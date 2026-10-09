// Scène 3D de l'accueil : un « I » à empattements en relief, traversé par
// un tracé d'électrocardiogramme, au milieu de facettes bordeaux.
(function () {
  const stage = document.getElementById("stage");
  const canvas = document.getElementById("scene");
  if (!stage || !canvas || !window.THREE) { stage && stage.classList.add("no-webgl"); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) { stage.classList.add("no-webgl"); return; }

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0.2, 15);

  // Environnement de studio : des boîtes à lumière blanches sur fond bordeaux,
  // pour que les surfaces brillantes aient quelque chose à refléter.
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x3a0910);
  const panel = (w, h, x, y, z, color, i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.material.color.multiplyScalar(i); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m);
  };
  panel(14, 6, 0, 9, 4, 0xffffff, 4.5);
  panel(12, 5, 0, 1, 10, 0xffffff, 2.4);
  panel(4, 12, -9, 0, 3, 0xffffff, 2.2);
  panel(4, 12, 9, 1, -2, 0xf1c4cb, 2.6);
  panel(10, 3, 0, -8, 5, 0xb5495b, 1.4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.03).texture;

  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 8); scene.add(key);
  const rim = new THREE.PointLight(0xf1c4cb, 40, 30); rim.position.set(-6, -2, 4); scene.add(rim);

  const world = new THREE.Group(); scene.add(world);

  // --- Le « I » : silhouette à empattements fins, extrudée et biseautée.
  const s = new THREE.Shape();
  const hw = 1.45, sw = 0.46, H = 2.2, t = 0.24;
  s.moveTo(-hw, -H); s.lineTo(hw, -H); s.lineTo(hw, -H + t);
  s.lineTo(sw + 0.1, -H + t + 0.08); s.lineTo(sw, -H + t + 0.5);
  s.lineTo(sw, H - t - 0.5); s.lineTo(sw + 0.1, H - t - 0.08);
  s.lineTo(hw, H - t); s.lineTo(hw, H); s.lineTo(-hw, H); s.lineTo(-hw, H - t);
  s.lineTo(-sw - 0.1, H - t - 0.08); s.lineTo(-sw, H - t - 0.5);
  s.lineTo(-sw, -H + t + 0.5); s.lineTo(-sw - 0.1, -H + t + 0.08); s.lineTo(-hw, -H + t);
  s.closePath();
  const iGeo = new THREE.ExtrudeGeometry(s, { depth: 0.9, bevelEnabled: true, bevelThickness: 0.14, bevelSize: 0.1, bevelSegments: 6, curveSegments: 8 });
  iGeo.center();
  const iMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.1, emissive: 0xf1c4cb, emissiveIntensity: 0.12 });
  const letter = new THREE.Mesh(iGeo, iMat);
  world.add(letter);

  // --- Le tracé : une ligne d'ECG en tube, qui se dessine puis reste vivante.
  const pts = [
    [-9, -0.6], [-5.2, -0.6], [-4.6, -0.25], [-4.0, -0.9], [-3.5, -0.6], [-2.6, -0.6],
    [-2.2, 0.1], [-1.7, -1.7], [-1.2, -0.6], [-0.35, -0.6],
    [0, 3.0], [0.55, -2.6], [1.0, -0.6], [2.4, -0.6], [3.0, 0.15], [3.6, -0.6], [9, -0.6],
  ].map(([x, y]) => new THREE.Vector3(x, y, 0.95));
  const curve = new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.12);
  const tubeSeg = 600, radial = 10;
  const tubeGeo = new THREE.TubeGeometry(curve, tubeSeg, 0.045, radial, false);
  const tubeMat = new THREE.MeshStandardMaterial({ color: 0xf1c4cb, emissive: 0xf1c4cb, emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  world.add(tube);
  const idxPerSeg = radial * 6;
  const totalIdx = tubeSeg * idxPerSeg;
  tubeGeo.setDrawRange(0, reduced ? totalIdx : 0);

  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 24), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  world.add(pulse);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.32, 24, 24), new THREE.MeshBasicMaterial({ color: 0xf1c4cb, transparent: true, opacity: 0.28 }));
  pulse.add(halo);

  // --- Facettes flottantes.
  const count = 46;
  const shardGeo = new THREE.OctahedronGeometry(0.2, 0);
  const shardMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.22, metalness: 0.4, clearcoat: 1, flatShading: true });
  const shards = new THREE.InstancedMesh(shardGeo, shardMat, count);
  const palette = [0x7a2230, 0x5b0f1b, 0xb5495b, 0xf1c4cb, 0xffffff].map((c) => new THREE.Color(c));
  const data = [];
  const dummy = new THREE.Object3D();
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = 3.6 + Math.random() * 4.2;
    data.push({ x: Math.cos(a) * r, y: (Math.random() - 0.5) * 7, z: (Math.random() - 0.35) * 6, sc: 0.5 + Math.random() * 1.6, sp: 0.3 + Math.random() * 0.8, ph: Math.random() * 6.28 });
    shards.setColorAt(i, palette[i % palette.length]);
  }
  world.add(shards);

  // --- Interaction : pointeur et défilement.
  const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  let scrollY = 0;
  window.addEventListener("scroll", () => { scrollY = window.scrollY; }, { passive: true });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Cadre le sujet : plus la scène est étroite, plus la caméra recule.
    camera.position.z = Math.max(15, 15 * (1.25 / camera.aspect) ** 0.9);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(stage);

  const clock = new THREE.Clock();
  let drawn = reduced ? 1 : 0;
  function frame() {
    requestAnimationFrame(frame);
    if (!visible && !reduced) return;
    const dt = Math.min(clock.getDelta(), 0.05), time = clock.elapsedTime;

    if (drawn < 1) {
      drawn = Math.min(1, drawn + dt / 2.6);
      const e = 1 - Math.pow(1 - drawn, 3);
      tubeGeo.setDrawRange(0, Math.floor(e * tubeSeg) * idxPerSeg);
    }

    if (!reduced) {
      cur.x += (target.x - cur.x) * 0.06;
      cur.y += (target.y - cur.y) * 0.06;
      const sc = Math.min(scrollY / 700, 1.4);
      world.rotation.y = cur.x * 0.5 + sc * 1.4 + Math.sin(time * 0.5) * 0.12;
      world.rotation.x = cur.y * 0.22;
      world.position.y = Math.sin(time * 0.9) * 0.12 - sc * 0.8;
      letter.rotation.y = Math.sin(time * 0.35) * 0.15;
    }

    // Le point lumineux parcourt le tracé en boucle.
    const u = ((time * 0.11) % 1);
    pulse.position.copy(curve.getPointAt(u));
    pulse.scale.setScalar(1 + Math.sin(time * 6) * 0.15);

    for (let i = 0; i < count; i++) {
      const d = data[i];
      dummy.position.set(d.x, d.y + Math.sin(time * d.sp + d.ph) * 0.35, d.z);
      dummy.rotation.set(time * d.sp * 0.6 + d.ph, time * d.sp * 0.4, 0);
      dummy.scale.setScalar(d.sc);
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    shards.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }
  frame();
  stage.classList.add("ready");
})();
