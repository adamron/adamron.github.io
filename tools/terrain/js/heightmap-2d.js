/**
 * heightmap-2d demo
 * Renders a 2D Perlin fBm heightmap with controls for frequency,
 * octaves, and persistence. Click to regenerate.
 */
registerDemo('heightmap-2d', {
  init: function (container) {
    var N = TerrainNoise;
    var canvas = document.createElement('canvas');
    canvas.style.imageRendering = 'pixelated';
    container.appendChild(canvas);

    var perm = N.buildPerm();
    var frequency = 4;
    var octaves = 5;
    var persistence = 0.5;

    var demoContainer = container.closest('.demo-container');

    bindSlider('frequency', function (v) { frequency = v; });
    bindSlider('octaves', function (v) { octaves = v; });
    bindSlider('persistence', function (v) { persistence = v / 100; });

    function bindSlider(name, setter) {
      var el = demoContainer.querySelector('[data-control="' + name + '"]');
      if (!el) return;
      setter(parseFloat(el.value));
      el.addEventListener('input', function () {
        setter(parseFloat(el.value));
        render();
      });
    }

    function render() {
      var rect = container.getBoundingClientRect();
      var res = Math.min(384, Math.round(Math.max(rect.width, rect.height)));
      N.renderHeightmap(canvas, res, function (x, y) {
        return N.perlinFbm(x, y, perm, frequency, octaves, persistence, 2);
      });
    }

    canvas.style.cursor = 'pointer';
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown', function () {
      perm = N.buildPerm();
      render();
    });

    window.addEventListener('resize', render);
    render();
  }
});
