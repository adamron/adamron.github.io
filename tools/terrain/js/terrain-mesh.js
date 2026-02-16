/**
 * terrain-mesh demo
 * 3D terrain mesh rendered with Three.js. Orbit with mouse/touch,
 * scroll to zoom. Controls for height scale, resolution, wireframe.
 */
registerDemo('terrain-mesh', {
  init: function (container) {
    var N = TerrainNoise;
    var perm = N.buildPerm();

    var heightScale = 0.5;
    var resolution = 128;
    var wireframe = false;
    var FREQ = 4, OCTAVES = 5, PERSISTENCE = 0.5;

    var terrainMesh = null;
    var wireMesh = null;

    var ctx = TerrainScene.create(container, { onRebuild: buildTerrain });

    function buildTerrain() {
      if (terrainMesh) { ctx.scene.remove(terrainMesh); terrainMesh.geometry.dispose(); terrainMesh.material.dispose(); }
      if (wireMesh) { ctx.scene.remove(wireMesh); wireMesh.geometry.dispose(); wireMesh.material.dispose(); }

      var res = resolution;
      var geo = new THREE.PlaneGeometry(1, 1, res - 1, res - 1);
      geo.rotateX(-Math.PI / 2);

      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i) + 0.5;
        var z = pos.getZ(i) + 0.5;
        var h = N.perlinFbm(x, z, perm, FREQ, OCTAVES, PERSISTENCE, 2);
        pos.setY(i, (h - 0.5) * heightScale);
      }
      geo.computeVertexNormals();

      terrainMesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
        color: 0x5a9a6a, roughness: 0.85, metalness: 0.05, flatShading: true
      }));
      ctx.scene.add(terrainMesh);

      wireMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
        color: 0x88ddaa, wireframe: true, transparent: true, opacity: 0.3
      }));
      wireMesh.visible = wireframe;
      ctx.scene.add(wireMesh);
    }

    ctx.bindSlider('height-scale', function (v) { heightScale = v / 100; ctx.needsRebuild = true; });
    ctx.bindSlider('resolution', function (v) { resolution = Math.round(v); ctx.needsRebuild = true; });
    ctx.bindSlider('wireframe', function (v) { wireframe = v >= 1; if (wireMesh) wireMesh.visible = wireframe; });
  }
});
