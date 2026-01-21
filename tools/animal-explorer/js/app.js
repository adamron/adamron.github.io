// Animal Explorer - Main Entry Point
(function(AE) {
  AE.init = function() {
    // Initialize DOM references
    AE.initElements();

    // Initialize detail view tag elements
    AE.initTagElements();

    // Render filter UI
    AE.renderFilterUI();
    AE.initFilterEvents();

    // Render gallery and setup lazy loading
    AE.renderGallery();
    AE.initLazyLoading();
    AE.initGalleryEvents();

    // Initialize detail view events
    AE.initDetailEvents();

    // Initialize all navigation handlers
    AE.initNavigation();
  };

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', AE.init);
})(AnimalExplorer);
