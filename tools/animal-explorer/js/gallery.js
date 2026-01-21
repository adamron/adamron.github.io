// Animal Explorer - Gallery Module
(function(AE) {
  // Helper to get thumbnail path from image path
  AE.getThumbnail = function(imagePath) {
    return imagePath.replace('images/', 'images/thumbs/');
  };

  // Render the gallery grid
  AE.renderGallery = function() {
    animals.forEach(function(animal, index) {
      var tile = document.createElement('div');
      tile.className = 'animal-tile';
      tile.dataset.index = index;

      // Hide animals without an image path
      if (!animal.image) {
        AE.state.validImageIndices.delete(index);
        tile.style.display = 'none';
      }

      tile.innerHTML =
        '<img data-src="' + AE.getThumbnail(animal.image || '') + '" alt="' + animal.name + '">' +
        '<div class="name">' + animal.name + '</div>';
      AE.els.grid.appendChild(tile);
    });
  };

  // Initialize lazy loading with IntersectionObserver
  AE.initLazyLoading = function() {
    var lazyImages = AE.els.grid.querySelectorAll('img[data-src]');
    var imageObserver = new IntersectionObserver(function(entries, observer) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var img = entry.target;
          img.src = img.dataset.src;
          img.onload = function() {
            img.classList.add('loaded');
          };
          img.onerror = function() {
            var tile = img.closest('.animal-tile');
            var index = parseInt(tile.dataset.index, 10);
            AE.state.validImageIndices.delete(index);
            tile.style.display = 'none';
            // Update filtered indices to exclude this animal
            AE.applyFilters();
          };
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '100px'
    });

    lazyImages.forEach(function(img) {
      imageObserver.observe(img);
    });
  };

  // Initialize gallery click handler
  AE.initGalleryEvents = function() {
    AE.els.grid.addEventListener('click', function(e) {
      var tile = e.target.closest('.animal-tile');
      if (tile && tile.dataset.index !== undefined) {
        AE.openDetail(parseInt(tile.dataset.index, 10));
      }
    });
  };
})(AnimalExplorer);
