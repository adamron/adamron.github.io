/**
 * colored-terrain demo
 * 3D terrain with height-based biome coloring: water, sand, grass,
 * rock, snow. Sliders for water level and snow line.
 */
registerDemo('colored-terrain', {
  init: function (container) {
    var N = TerrainNoise;
    var perm = N.buildPerm();

    var waterLevel = 0.40;
    var snowLine = 0.80;
    var FREQ = 4, OCTAVES = 5, PERSISTENCE = 0.5;
    var RES = 128;
    var HEIGHT = 0.55;

    // Biome colors (RGB 0–1)
    var DEEP_WATER = [0.12, 0.20, 0.45];
    var SHALLOW_WATER = [0.18, 0.32, 0.55];
    var SAND = [0.76, 0.70, 0.50];
    var GRASS = [0.30, 0.55, 0.25];
    var FOREST = [0.20, 0.38, 0.15];
    var ROCK = [0.45, 0.42, 0.40];
    var SNOW = [0.92, 0.93, 0.95];

    function lerp3(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }

    function biomeColor(h) {
      // h is raw noise 0–1, waterLevel and snowLine are thresholds in that space
      if (h < waterLevel - 0.08) return DEEP_WATER;
      if (h < waterLevel) return lerp3(DEEP_WATER, SHALLOW_WATER, (h - (waterLevel - 0.08)) / 0.08);
      // Normalize above-water height to 0–1
      var t = (h - waterLevel) / (1 - waterLevel);
      if (t < 0.05) return lerp3(SAND, GRASS, t / 0.05);
      var snowT = (snowLine - waterLevel) / (1 - waterLevel);
      if (t < snowT * 0.5) return lerp3(GRASS, FOREST, (t - 0.05) / (snowT * 0.5 - 0.05));
      if (t < snowT) return lerp3(FOREST, ROCK, (t - snowT * 0.5) / (snowT - snowT * 0.5));
      if (t < snowT + 0.08) return lerp3(ROCK, SNOW, (t - snowT) / 0.08);
      return SNOW;
    }

    var mesh = null;
    var waterMesh = null;

    var ctx = TerrainScene.create(container, { onRebuild: build });

    function build() {
      if (mesh) { ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
      if (waterMesh) { ctx.scene.remove(waterMesh); waterMesh.geometry.dispose(); waterMesh.material.dispose(); }

      var geo = new THREE.PlaneGeometry(1, 1, RES - 1, RES - 1);
      geo.rotateX(-Math.PI / 2);

      var pos = geo.attributes.position;
      var colors = new Float32Array(pos.count * 3);

      // Store raw noise values for coloring
      var rawH = new Float32Array(pos.count);
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i) + 0.5;
        var z = pos.getZ(i) + 0.5;
        rawH[i] = N.perlinFbm(x, z, perm, FREQ, OCTAVES, PERSISTENCE, 2);
        // Clamp terrain at water level (flat water surface)
        var displayH = Math.max(rawH[i], waterLevel);
        pos.setY(i, (displayH - 0.5) * HEIGHT);
      }

      // Assign vertex colors
      for (var i = 0; i < pos.count; i++) {
        var c = biomeColor(rawH[i]);
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: true
      }));
      ctx.scene.add(mesh);

      // Translucent water plane
      var waterGeo = new THREE.PlaneGeometry(1, 1);
      waterGeo.rotateX(-Math.PI / 2);
      waterMesh = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
        color: 0x2050a0,
        transparent: true,
        opacity: 0.35,
        roughness: 0.2,
        metalness: 0.1
      }));
      waterMesh.position.y = (waterLevel - 0.5) * HEIGHT;
      ctx.scene.add(waterMesh);
    }

    ctx.bindSlider('water-level', function (v) { waterLevel = v / 100; ctx.needsRebuild = true; });
    ctx.bindSlider('snow-line', function (v) { snowLine = v / 100; ctx.needsRebuild = true; });
  }
});
