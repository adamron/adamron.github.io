/**
 * shaping demo
 * 3D terrain with shaping controls: power redistribution,
 * terracing, and domain warping. Same orbit/zoom as other 3D demos.
 */
registerDemo('shaping', {
  init: function (container) {
    var N = TerrainNoise;
    var perm = N.buildPerm();
    var warpPerm = N.buildPerm(); // separate perm for domain warp noise

    var exponent = 1.0;   // slider 10–400 → 0.1–4.0
    var terraces = 0;     // 0 = off, 1–20 = number of steps
    var warpStrength = 0; // slider 0–100 → 0.0–0.3
    var FREQ = 4, OCTAVES = 5, PERSISTENCE = 0.5;
    var RES = 128;
    var HEIGHT = 0.55;

    var mesh = null;

    var ctx = TerrainScene.create(container, { onRebuild: build });

    function shape(h) {
      // Redistribution
      h = Math.pow(h, exponent);
      // Terracing
      if (terraces > 0) {
        h = Math.round(h * terraces) / terraces;
      }
      return h;
    }

    function sample(x, z) {
      // Domain warping: offset input coordinates by another noise value
      if (warpStrength > 0) {
        var wx = N.perlinFbm(x + 5.2, z + 1.3, warpPerm, FREQ, 3, 0.5, 2);
        var wz = N.perlinFbm(x + 9.7, z + 6.1, warpPerm, FREQ, 3, 0.5, 2);
        x += (wx - 0.5) * warpStrength;
        z += (wz - 0.5) * warpStrength;
      }
      var h = N.perlinFbm(x, z, perm, FREQ, OCTAVES, PERSISTENCE, 2);
      return shape(h);
    }

    function build() {
      if (mesh) { ctx.scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose(); }

      var geo = new THREE.PlaneGeometry(1, 1, RES - 1, RES - 1);
      geo.rotateX(-Math.PI / 2);

      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i) + 0.5;
        var z = pos.getZ(i) + 0.5;
        var h = sample(x, z);
        pos.setY(i, (h - 0.5) * HEIGHT);
      }
      geo.computeVertexNormals();

      mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x5a9a6a, roughness: 0.85, metalness: 0.05, flatShading: true
      }));
      ctx.scene.add(mesh);
    }

    ctx.bindSlider('exponent', function (v) { exponent = v / 100; ctx.needsRebuild = true; });
    ctx.bindSlider('terraces', function (v) { terraces = Math.round(v); ctx.needsRebuild = true; });
    ctx.bindSlider('warp', function (v) { warpStrength = v / 100 * 0.3; ctx.needsRebuild = true; });
  }
});
