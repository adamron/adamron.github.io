/* =============================================
   Procedural Terrain — App Initialization
   ============================================= */

/**
 * Registry of demo modules.
 * Each key corresponds to a data-demo attribute on a .demo-canvas-wrap element.
 * When a demo module is implemented, register it here and it will be
 * automatically initialized when scrolled into view.
 *
 * Expected module interface:
 *   { init(container: HTMLElement): void, destroy?(): void }
 */
const demoModules = {};

/**
 * Register a demo module so it gets picked up by the lazy loader.
 * Call this from individual demo JS files:
 *   registerDemo('noise-1d', { init(el) { ... } });
 */
function registerDemo(name, module) {
  demoModules[name] = module;
}

/* --- Placeholder rendering --- */

function initPlaceholders() {
  const containers = document.querySelectorAll('.demo-canvas-wrap[data-demo]');

  containers.forEach(container => {
    const demoName = container.dataset.demo;

    // If a real module is registered, initialize it
    if (demoModules[demoName]) {
      demoModules[demoName].init(container);
      return;
    }

    // Otherwise show placeholder
    if (!container.querySelector('.demo-placeholder')) {
      const desc = container.dataset.description || 'Interactive demo';
      const placeholder = document.createElement('div');
      placeholder.className = 'demo-placeholder';
      placeholder.innerHTML = `
        <div class="demo-placeholder-icon">&#9649;</div>
        <div class="demo-placeholder-label">${desc}</div>
      `;
      container.appendChild(placeholder);
    }
  });
}

/* --- Smooth scroll for TOC links --- */

function initTocLinks() {
  document.querySelectorAll('.toc a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', link.getAttribute('href'));
      }
    });
  });
}

/* --- Init (called after all demo scripts have loaded) --- */

function initAll() {
  initPlaceholders();
  initTocLinks();
}
