/**
 * erosion demo
 * 3D terrain with hydraulic erosion simulation. Droplets flow downhill,
 * eroding and depositing sediment. Sliders for droplet count, erosion
 * rate, and deposition rate.
 */
registerDemo('erosion', {
  init: function (container) {
    var N = TerrainNoise;
    var perm = N.buildPerm();

    var droplets = 20000;
    var erosionRate = 0.3;
    var depositionRate = 0.15;
    var FREQ = 4, OCTAVES = 5, PERSISTENCE = 0.5;
    var GRID = 128;
    var HEIGHT = 0.55;
    var WATER_LEVEL = 0.38;

    // Biome colors
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
      if (h < WATER_LEVEL - 0.08) return DEEP_WATER;
      if (h < WATER_LEVEL) return lerp3(DEEP_WATER, SHALLOW_WATER, (h - (WATER_LEVEL - 0.08)) / 0.08);
      var t = (h - WATER_LEVEL) / (1 - WATER_LEVEL);
      if (t < 0.05) return lerp3(SAND, GRASS, t / 0.05);
      if (t < 0.35) return lerp3(GRASS, FOREST, (t - 0.05) / 0.30);
      if (t < 0.7) return lerp3(FOREST, ROCK, (t - 0.35) / 0.35);
      if (t < 0.78) return lerp3(ROCK, SNOW, (t - 0.7) / 0.08);
      return SNOW;
    }

    // Generate base heightmap
    var baseMap = new Float32Array(GRID * GRID);
    for (var gy = 0; gy < GRID; gy++) {
      for (var gx = 0; gx < GRID; gx++) {
        baseMap[gy * GRID + gx] = N.perlinFbm(gx / GRID, gy / GRID, perm, FREQ, OCTAVES, PERSISTENCE, 2);
      }
    }

    // --- Hydraulic erosion ---
    function erode(heightmap, numDroplets, eRate, dRate) {
      var map = new Float32Array(heightmap);
      var size = GRID;

      for (var d = 0; d < numDroplets; d++) {
        var px = Math.random() * (size - 2) + 1;
        var py = Math.random() * (size - 2) + 1;
        var dirX = 0, dirY = 0;
        var speed = 1;
        var water = 1;
        var sediment = 0;
        var maxSteps = 64;

        for (var step = 0; step < maxSteps; step++) {
          var xi = Math.floor(px);
          var yi = Math.floor(py);
          if (xi < 1 || xi >= size - 1 || yi < 1 || yi >= size - 1) break;

          var fx = px - xi;
          var fy = py - yi;

          // Bilinear height
          var h00 = map[yi * size + xi];
          var h10 = map[yi * size + xi + 1];
          var h01 = map[(yi + 1) * size + xi];
          var h11 = map[(yi + 1) * size + xi + 1];
          var h = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;

          // Gradient
          var gx = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
          var gy2 = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;

          // Update direction with inertia
          dirX = dirX * 0.5 - gx * 0.5;
          dirY = dirY * 0.5 - gy2 * 0.5;
          var len = Math.sqrt(dirX * dirX + dirY * dirY);
          if (len < 0.0001) break;
          dirX /= len;
          dirY /= len;

          // Move
          px += dirX;
          py += dirY;

          var nxi = Math.floor(px);
          var nyi = Math.floor(py);
          if (nxi < 1 || nxi >= size - 1 || nyi < 1 || nyi >= size - 1) break;

          var nfx = px - nxi;
          var nfy = py - nyi;
          var nh = map[nyi * size + nxi] * (1 - nfx) * (1 - nfy)
            + map[nyi * size + nxi + 1] * nfx * (1 - nfy)
            + map[(nyi + 1) * size + nxi] * (1 - nfx) * nfy
            + map[(nyi + 1) * size + nxi + 1] * nfx * nfy;

          var dh = nh - h;

          // Capacity based on speed and slope
          var capacity = Math.max(-dh, 0.001) * speed * water * 8;

          if (sediment > capacity || dh > 0) {
            // Deposit
            var deposit = dh > 0
              ? Math.min(sediment, dh)
              : (sediment - capacity) * dRate;
            sediment -= deposit;
            // Distribute to 4 corners
            map[yi * size + xi] += deposit * (1 - fx) * (1 - fy);
            map[yi * size + xi + 1] += deposit * fx * (1 - fy);
            map[(yi + 1) * size + xi] += deposit * (1 - fx) * fy;
            map[(yi + 1) * size + xi + 1] += deposit * fx * fy;
          } else {
            // Erode
            var amount = Math.min((capacity - sediment) * eRate, -dh);
            sediment += amount;
            map[yi * size + xi] -= amount * (1 - fx) * (1 - fy);
            map[yi * size + xi + 1] -= amount * fx * (1 - fy);
            map[(yi + 1) * size + xi] -= amount * (1 - fx) * fy;
            map[(yi + 1) * size + xi + 1] -= amount * fx * fy;
          }

          speed = Math.sqrt(Math.max(speed * speed - dh * 4, 0.001));
          water *= 0.995;
        }
      }
      return map;
    }

    var mesh = null;
    var waterMesh = null;

    var ctx = TerrainScene.create(container, { onRebuild: build });

    function build() {
      if (mesh) { ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
      if (waterMesh) { ctx.scene.remove(waterMesh); waterMesh.geometry.dispose(); waterMesh.material.dispose(); }

      var erodedMap = erode(baseMap, droplets, erosionRate, depositionRate);

      var geo = new THREE.PlaneGeometry(1, 1, GRID - 1, GRID - 1);
      geo.rotateX(-Math.PI / 2);

      var pos = geo.attributes.position;
      var colors = new Float32Array(pos.count * 3);

      for (var i = 0; i < pos.count; i++) {
        // PlaneGeometry lays out vertices row by row
        var gx = i % GRID;
        var gy = Math.floor(i / GRID);
        var h = erodedMap[gy * GRID + gx];
        var displayH = Math.max(h, WATER_LEVEL);
        pos.setY(i, (displayH - 0.5) * HEIGHT);

        var c = biomeColor(h);
        colors[i * 3] = c[0];
        colors[i * 3 + 1] = c[1];
        colors[i * 3 + 2] = c[2];
      }

      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geo.computeVertexNormals();

      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.85, metalness: 0.05, flatShading: true
      }));
      ctx.scene.add(mesh);

      var waterGeo = new THREE.PlaneGeometry(1, 1);
      waterGeo.rotateX(-Math.PI / 2);
      waterMesh = new THREE.Mesh(waterGeo, new THREE.MeshStandardMaterial({
        color: 0x2050a0, transparent: true, opacity: 0.35, roughness: 0.2, metalness: 0.1
      }));
      waterMesh.position.y = (WATER_LEVEL - 0.5) * HEIGHT;
      ctx.scene.add(waterMesh);
    }

    ctx.bindSlider('droplets', function (v) { droplets = Math.round(v); ctx.needsRebuild = true; });
    ctx.bindSlider('erosion-rate', function (v) { erosionRate = v / 100 * 0.6; ctx.needsRebuild = true; });
    ctx.bindSlider('deposition-rate', function (v) { depositionRate = v / 100 * 0.5; ctx.needsRebuild = true; });
  }
});
