// Animal Explorer - Detail View Module
(function(AE) {
  // Pre-create tag elements for detail view
  AE.initTagElements = function() {
    AE.tagCategories.forEach(function(cat) {
      var tag = document.createElement('span');
      tag.className = 'tag';
      tag.dataset.category = cat;
      tag.innerHTML = '<span class="tag-label">' + cat + '</span><span class="tag-value"></span>';
      AE.els.tagsContainer.appendChild(tag);
      AE.tagElements[cat] = tag.querySelector('.tag-value');
    });
  };

  // Open detail view
  AE.openDetail = function(index) {
    AE.state.currentIndex = index;
    AE.updateDetail();
    AE.els.detail.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Close detail view
  AE.closeDetail = function() {
    AE.els.detail.classList.remove('active');
    document.body.style.overflow = '';
  };

  // Update detail view content
  AE.updateDetail = function() {
    var animal = animals[AE.state.currentIndex];
    AE.els.detailImg.src = animal.image;
    AE.els.detailImg.alt = animal.name;
    AE.els.detailTitle.textContent = animal.name;

    // Counter shows position in filtered list
    var filteredPos = AE.state.filteredIndices.indexOf(AE.state.currentIndex) + 1;
    AE.els.counter.textContent = filteredPos + ' / ' + AE.state.filteredIndices.length;

    // Update pre-created tag elements
    AE.tagCategories.forEach(function(cat) {
      AE.tagElements[cat].textContent = animal.tags[cat] || '';
    });

    // Preload adjacent images
    AE.preloadAdjacentImages(filteredPos - 1);
  };

  // Preload adjacent images for smooth navigation
  AE.preloadAdjacentImages = function(filteredPos) {
    if (AE.state.filteredIndices.length <= 1) return;

    var prevPos = filteredPos === 0 ? AE.state.filteredIndices.length - 1 : filteredPos - 1;
    var nextPos = filteredPos === AE.state.filteredIndices.length - 1 ? 0 : filteredPos + 1;

    [prevPos, nextPos].forEach(function(pos) {
      var animalIndex = AE.state.filteredIndices[pos];
      var imageSrc = animals[animalIndex].image;
      if (imageSrc && !AE.preloadCache.has(imageSrc)) {
        AE.preloadCache.add(imageSrc);
        var img = new Image();
        img.src = imageSrc;
      }
    });
  };

  // Navigate to next/previous animal
  AE.navigate = function(direction) {
    if (AE.state.filteredIndices.length === 0) return;

    var currentFilteredPos = AE.state.filteredIndices.indexOf(AE.state.currentIndex);
    var newFilteredPos = currentFilteredPos + direction;

    // Wrap around
    if (newFilteredPos < 0) newFilteredPos = AE.state.filteredIndices.length - 1;
    if (newFilteredPos >= AE.state.filteredIndices.length) newFilteredPos = 0;

    AE.state.currentIndex = AE.state.filteredIndices[newFilteredPos];
    AE.updateDetail();
  };

  // Initialize detail view event handlers
  AE.initDetailEvents = function() {
    AE.els.closeBtn.addEventListener('click', AE.closeDetail);
    AE.els.prevBtn.addEventListener('click', function() { AE.navigate(-1); });
    AE.els.nextBtn.addEventListener('click', function() { AE.navigate(1); });
  };
})(AnimalExplorer);
