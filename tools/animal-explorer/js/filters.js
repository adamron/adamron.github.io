// Animal Explorer - Filters Module
(function(AE) {
  // Build filter options from animal data
  AE.buildFilterOptions = function() {
    var tagValues = {};
    AE.tagCategories.forEach(function(cat) {
      tagValues[cat] = new Set();
      animals.forEach(function(a) {
        if (a.tags[cat]) tagValues[cat].add(a.tags[cat]);
      });
    });
    return tagValues;
  };

  // Render filter UI
  AE.renderFilterUI = function() {
    var tagValues = AE.buildFilterOptions();

    AE.tagCategories.forEach(function(cat) {
      var values = Array.from(tagValues[cat]).sort();
      if (values.length === 0) return;

      var group = document.createElement('div');
      group.className = 'filter-group';
      group.innerHTML =
        '<span class="filter-group-label">' + cat + '</span>' +
        '<div class="filter-options">' +
          values.map(function(v) {
            return '<button class="filter-option" data-category="' + cat + '" data-value="' + v + '">' + v + '</button>';
          }).join('') +
        '</div>';
      AE.els.filtersContent.appendChild(group);
    });
  };

  // Initialize filter event handlers
  AE.initFilterEvents = function() {
    // Filter toggle
    AE.els.filtersToggle.addEventListener('click', function() {
      AE.els.filtersEl.classList.toggle('open');
    });

    // Filter option click handler
    AE.els.filtersContent.addEventListener('click', function(e) {
      var btn = e.target.closest('.filter-option');
      if (!btn) return;

      var cat = btn.dataset.category;
      var val = btn.dataset.value;

      if (!AE.state.activeFilters[cat]) {
        AE.state.activeFilters[cat] = new Set();
      }

      if (AE.state.activeFilters[cat].has(val)) {
        AE.state.activeFilters[cat].delete(val);
        btn.classList.remove('active');
      } else {
        AE.state.activeFilters[cat].add(val);
        btn.classList.add('active');
      }

      AE.applyFilters();
    });
  };

  // Apply filters to gallery
  AE.applyFilters = function() {
    // Count active filters
    var totalActive = 0;
    Object.values(AE.state.activeFilters).forEach(function(s) {
      totalActive += s.size;
    });
    AE.els.filtersCount.textContent = totalActive > 0 ? '(' + totalActive + ')' : '';

    // Filter animals
    AE.state.filteredIndices.length = 0;
    animals.forEach(function(animal, index) {
      // Skip animals without valid images
      if (!AE.state.validImageIndices.has(index)) return;

      var matches = true;
      for (var cat in AE.state.activeFilters) {
        if (AE.state.activeFilters[cat].size > 0) {
          if (!AE.state.activeFilters[cat].has(animal.tags[cat])) {
            matches = false;
            break;
          }
        }
      }

      var tile = AE.els.grid.children[index];
      if (matches) {
        AE.state.filteredIndices.push(index);
        tile.classList.remove('hidden');
      } else {
        tile.classList.add('hidden');
      }
    });
  };
})(AnimalExplorer);
