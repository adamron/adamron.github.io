/**
 * Shared Three.js scene setup, orbit controls, and render loop
 * used by multiple 3D demos.
 *
 * Usage:
 *   var ctx = TerrainScene.create(container, { onRebuild: fn });
 *   ctx.needsRebuild = true;  // triggers onRebuild next frame
 */
var TerrainScene = (function () {

  function create(container, opts) {
    opts = opts || {};

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0a);
    container.appendChild(renderer.domElement);
    var domEl = renderer.domElement;
    domEl.style.position = 'absolute';
    domEl.style.top = '0';
    domEl.style.left = '0';
    domEl.style.width = '100%';
    domEl.style.height = '100%';

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);

    // Lighting
    scene.add(new THREE.AmbientLight(0x404050, 1.2));
    var dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(2, 3, 1);
    scene.add(dirLight);

    // --- Orbit ---
    var orbiting = false;
    var orbitStart = { x: 0, y: 0 };
    var spherical = { theta: Math.PI / 4, phi: Math.PI / 4, radius: 1.7 };

    function updateCamera() {
      var r = spherical.radius;
      var sinPhi = Math.sin(spherical.phi);
      camera.position.set(
        r * sinPhi * Math.sin(spherical.theta),
        r * Math.cos(spherical.phi),
        r * sinPhi * Math.cos(spherical.theta)
      );
      camera.lookAt(0, 0, 0);
    }

    domEl.style.touchAction = 'none';
    domEl.style.cursor = 'grab';

    domEl.addEventListener('pointerdown', function (e) {
      orbiting = true;
      orbitStart.x = e.clientX;
      orbitStart.y = e.clientY;
      domEl.setPointerCapture(e.pointerId);
      domEl.style.cursor = 'grabbing';
    });
    domEl.addEventListener('pointermove', function (e) {
      if (!orbiting) return;
      var dx = e.clientX - orbitStart.x;
      var dy = e.clientY - orbitStart.y;
      spherical.theta -= dx * 0.008;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, spherical.phi - dy * 0.008));
      orbitStart.x = e.clientX;
      orbitStart.y = e.clientY;
      updateCamera();
    });
    domEl.addEventListener('pointerup', function () {
      orbiting = false;
      domEl.style.cursor = 'grab';
    });
    domEl.addEventListener('wheel', function (e) {
      e.preventDefault();
      spherical.radius = Math.max(0.6, Math.min(4, spherical.radius + e.deltaY * 0.002));
      updateCamera();
    }, { passive: false });

    // --- Slider helper ---
    var demoContainer = container.closest('.demo-container');
    function bindSlider(name, setter) {
      var slider = demoContainer.querySelector('[data-control="' + name + '"]');
      if (!slider) return;
      setter(parseFloat(slider.value));
      slider.addEventListener('input', function () {
        setter(parseFloat(slider.value));
      });
    }

    // --- Resize ---
    function resize() {
      var rect = container.getBoundingClientRect();
      renderer.setSize(rect.width, rect.height);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();
    updateCamera();

    // --- Context object ---
    var ctx = {
      scene: scene,
      camera: camera,
      renderer: renderer,
      needsRebuild: false,
      bindSlider: bindSlider
    };

    // --- Render loop ---
    var lastRebuild = 0;
    function animate() {
      requestAnimationFrame(animate);
      if (ctx.needsRebuild) {
        var now = performance.now();
        if (now - lastRebuild > 80) {
          if (opts.onRebuild) opts.onRebuild();
          ctx.needsRebuild = false;
          lastRebuild = now;
        }
      }
      renderer.render(scene, camera);
    }
    animate();

    // Trigger initial build on next frame (after caller has ctx reference)
    requestAnimationFrame(function () {
      ctx.needsRebuild = true;
    });

    return ctx;
  }

  return { create: create };
})();
