/**
 * full-terrain demo
 * Complete pipeline: seeded noise → fBm → domain warp → redistribution
 * → erosion → biome coloring. Controls for seed, octaves, height,
 * erosion amount, and water level.
 */
registerDemo('full-terrain', {
  init: function (container) {
    var N = TerrainNoise;

    var seed = 42;
    var octaves = 6;
    var heightScale = 0.6;
    var erosionAmount = 0.4; // 0–1, maps to 0–40000 droplets
    var waterLevel = 0.35;
    var FREQ = 4, PERSISTENCE = 0.5;
    var GRID = 128;
    var WARP = 0.12;
    var EXPONENT = 1.3;

    // Biome colors
    var DEEP_WATER = [0.08, 0.15, 0.40];
    var SHALLOW_WATER = [0.14, 0.28, 0.52];
    var SAND = [0.76, 0.70, 0.50];
    var GRASS = [0.30, 0.55, 0.25];
    var FOREST = [0.18, 0.35, 0.13];
    var ROCK = [0.45, 0.42, 0.40];
    var SNOW = [0.92, 0.93, 0.95];

    function lerp3(a, b, t) {
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
    }

    function biomeColor(h) {
      if (h < waterLevel - 0.08) return DEEP_WATER;
      if (h < waterLevel) return lerp3(DEEP_WATER, SHALLOW_WATER, (h - (waterLevel - 0.08)) / 0.08);
      var t = (h - waterLevel) / (1 - waterLevel);
      if (t < 0.05) return lerp3(SAND, GRASS, t / 0.05);
      if (t < 0.35) return lerp3(GRASS, FOREST, (t - 0.05) / 0.30);
      if (t < 0.65) return lerp3(FOREST, ROCK, (t - 0.35) / 0.30);
      if (t < 0.73) return lerp3(ROCK, SNOW, (t - 0.65) / 0.08);
      return SNOW;
    }

    // --- Erosion (inlined from erosion.js for self-containment) ---
    function erode(map, size, numDroplets, rng) {
      var eRate = 0.3, dRate = 0.15;
      for (var d = 0; d < numDroplets; d++) {
        var px = rng() * (size - 2) + 1;
        var py = rng() * (size - 2) + 1;
        var dirX = 0, dirY = 0, speed = 1, water = 1, sediment = 0;
        for (var step = 0; step < 64; step++) {
          var xi = Math.floor(px), yi = Math.floor(py);
          if (xi < 1 || xi >= size - 1 || yi < 1 || yi >= size - 1) break;
          var fx = px - xi, fy = py - yi;
          var h00 = map[yi * size + xi], h10 = map[yi * size + xi + 1];
          var h01 = map[(yi + 1) * size + xi], h11 = map[(yi + 1) * size + xi + 1];
          var h = h00 * (1 - fx) * (1 - fy) + h10 * fx * (1 - fy) + h01 * (1 - fx) * fy + h11 * fx * fy;
          var gx = (h10 - h00) * (1 - fy) + (h11 - h01) * fy;
          var gy = (h01 - h00) * (1 - fx) + (h11 - h10) * fx;
          dirX = dirX * 0.5 - gx * 0.5;
          dirY = dirY * 0.5 - gy * 0.5;
          var len = Math.sqrt(dirX * dirX + dirY * dirY);
          if (len < 0.0001) break;
          dirX /= len; dirY /= len;
          px += dirX; py += dirY;
          var nxi = Math.floor(px), nyi = Math.floor(py);
          if (nxi < 1 || nxi >= size - 1 || nyi < 1 || nyi >= size - 1) break;
          var nfx = px - nxi, nfy = py - nyi;
          var nh = map[nyi * size + nxi] * (1 - nfx) * (1 - nfy)
            + map[nyi * size + nxi + 1] * nfx * (1 - nfy)
            + map[(nyi + 1) * size + nxi] * (1 - nfx) * nfy
            + map[(nyi + 1) * size + nxi + 1] * nfx * nfy;
          var dh = nh - h;
          var capacity = Math.max(-dh, 0.001) * speed * water * 8;
          if (sediment > capacity || dh > 0) {
            var deposit = dh > 0 ? Math.min(sediment, dh) : (sediment - capacity) * dRate;
            sediment -= deposit;
            map[yi * size + xi] += deposit * (1 - fx) * (1 - fy);
            map[yi * size + xi + 1] += deposit * fx * (1 - fy);
            map[(yi + 1) * size + xi] += deposit * (1 - fx) * fy;
            map[(yi + 1) * size + xi + 1] += deposit * fx * fy;
          } else {
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
    }

    var mesh = null;
    var waterMesh = null;

    var ctx = TerrainScene.create(container, { onRebuild: build });

    function build() {
      if (mesh) { ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }
      if (waterMesh) { ctx.scene.remove(waterMesh); waterMesh.geometry.dispose(); waterMesh.material.dispose(); }

      var perm = N.buildPermSeeded(seed);
      var warpPerm = N.buildPermSeeded(seed + 9999);
      var rng = N.mulberry32(seed + 7777);

      // Build heightmap with domain warp + redistribution
      var heightmap = new Float32Array(GRID * GRID);
      for (var gy = 0; gy < GRID; gy++) {
        for (var gx = 0; gx < GRID; gx++) {
          var x = gx / GRID, z = gy / GRID;
          // Domain warp
          var wx = N.perlinFbm(x + 5.2, z + 1.3, warpPerm, FREQ, 3, 0.5, 2);
          var wz = N.perlinFbm(x + 9.7, z + 6.1, warpPerm, FREQ, 3, 0.5, 2);
          x += (wx - 0.5) * WARP;
          z += (wz - 0.5) * WARP;
          var h = N.perlinFbm(x, z, perm, FREQ, octaves, PERSISTENCE, 2);
          // Redistribution
          h = Math.pow(h, EXPONENT);
          heightmap[gy * GRID + gx] = h;
        }
      }

      // Erosion
      var numDroplets = Math.round(erosionAmount * 40000);
      if (numDroplets > 0) {
        erode(heightmap, GRID, numDroplets, rng);
      }

      // Build mesh
      var geo = new THREE.PlaneGeometry(1, 1, GRID - 1, GRID - 1);
      geo.rotateX(-Math.PI / 2);

      var pos = geo.attributes.position;
      var colors = new Float32Array(pos.count * 3);

      for (var i = 0; i < pos.count; i++) {
        var gi = (Math.floor(i / GRID)) * GRID + (i % GRID);
        var h = heightmap[gi];
        var displayH = Math.max(h, waterLevel);
        pos.setY(i, (displayH - 0.5) * heightScale);

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
      waterMesh.position.y = (waterLevel - 0.5) * heightScale;
      ctx.scene.add(waterMesh);
    }

    ctx.bindSlider('seed', function (v) { seed = Math.round(v); ctx.needsRebuild = true; });
    ctx.bindSlider('octaves', function (v) { octaves = Math.round(v); ctx.needsRebuild = true; });
    ctx.bindSlider('height-scale', function (v) { heightScale = v / 100; ctx.needsRebuild = true; });
    ctx.bindSlider('erosion', function (v) { erosionAmount = v / 100; ctx.needsRebuild = true; });
    ctx.bindSlider('water-level', function (v) { waterLevel = v / 100; ctx.needsRebuild = true; });
  }
});
