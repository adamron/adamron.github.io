/**
 * value-vs-perlin demo (split: left = value noise, right = gradient noise)
 * Renders 2D noise as grayscale heightmaps side by side.
 * Both use the same seed so the structural difference is visible.
 * Click either side to regenerate both with a new seed.
 */
(function () {
  var N = TerrainNoise;
  var FREQ = 6, OCTAVES = 4, PERSISTENCE = 0.5, LACUNARITY = 2;

  var perm = N.buildPerm();
  var valueTable = N.buildValueTable();

  var leftCanvas = null;
  var rightCanvas = null;

  function render() {
    if (leftCanvas) {
      N.renderHeightmap(leftCanvas, 256, function (x, y) {
        return N.valueFbm(x, y, perm, valueTable, FREQ, OCTAVES, PERSISTENCE, LACUNARITY);
      });
    }
    if (rightCanvas) {
      N.renderHeightmap(rightCanvas, 256, function (x, y) {
        return N.perlinFbm(x, y, perm, FREQ, OCTAVES, PERSISTENCE, LACUNARITY);
      });
    }
  }

  function regenerate() {
    perm = N.buildPerm();
    valueTable = N.buildValueTable();
    render();
  }

  function initHalf(container, side) {
    var canvas = document.createElement('canvas');
    canvas.style.imageRendering = 'pixelated';
    container.appendChild(canvas);

    if (side === 'left') leftCanvas = canvas;
    else rightCanvas = canvas;

    if (leftCanvas && rightCanvas) render();

    canvas.style.cursor = 'pointer';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', regenerate);
    window.addEventListener('resize', function () {
      if (leftCanvas && rightCanvas) render();
    });
  }

  registerDemo('value-vs-perlin-left', {
    init: function (container) { initHalf(container, 'left'); }
  });
  registerDemo('value-vs-perlin-right', {
    init: function (container) { initHalf(container, 'right'); }
  });
})();
