// Animal Explorer - State and Configuration
var AnimalExplorer = AnimalExplorer || {};

(function(AE) {
  // Application state
  AE.state = {
    currentIndex: 0,
    filteredIndices: [],
    activeFilters: {},
    validImageIndices: new Set()
  };

  // Tag categories for filters and detail view
  AE.tagCategories = ['class', 'biome', 'diet', 'geography', 'conservation'];

  // DOM element references (populated by initElements)
  AE.els = {};

  // Pre-created tag elements for detail view
  AE.tagElements = {};

  // Preload cache to avoid creating duplicate Image objects
  AE.preloadCache = new Set();

  // Initialize DOM element references
  AE.initElements = function() {
    AE.els = {
      grid: document.getElementById('grid'),
      detail: document.getElementById('detail'),
      detailImg: document.getElementById('detail-img'),
      detailTitle: document.getElementById('detail-title'),
      tagsContainer: document.getElementById('tags'),
      counter: document.getElementById('counter'),
      closeBtn: document.getElementById('close-btn'),
      prevBtn: document.getElementById('prev-btn'),
      nextBtn: document.getElementById('next-btn'),
      filtersEl: document.getElementById('filters'),
      filtersToggle: document.getElementById('filters-toggle'),
      filtersContent: document.getElementById('filters-content'),
      filtersCount: document.getElementById('filters-count')
    };

    // Initialize state
    AE.state.filteredIndices = animals.map(function(_, i) { return i; });
    AE.state.validImageIndices = new Set(animals.map(function(_, i) { return i; }));
  };
})(AnimalExplorer);
