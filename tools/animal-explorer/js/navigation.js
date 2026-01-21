// Animal Explorer - Navigation Module
(function(AE) {
  // Drag state
  var isDragging = false;
  var dragStartX = 0;
  var dragCurrentX = 0;

  function startDrag(x) {
    isDragging = true;
    dragStartX = x;
    dragCurrentX = x;
    AE.els.detailImg.classList.add('dragging');
  }

  function moveDrag(x) {
    if (!isDragging) return;
    dragCurrentX = x;
    var diff = dragCurrentX - dragStartX;
    var opacity = 1 - Math.min(Math.abs(diff) / 300, 0.5);
    AE.els.detailImg.style.transform = 'translateX(' + diff + 'px)';
    AE.els.detailImg.style.opacity = opacity;
  }

  function endDrag() {
    if (!isDragging) return;
    isDragging = false;
    AE.els.detailImg.classList.remove('dragging');

    var diff = dragCurrentX - dragStartX;
    var threshold = 80;

    if (Math.abs(diff) > threshold) {
      // Animate out, then switch
      var direction = diff > 0 ? -1 : 1;
      var exitX = diff > 0 ? '100%' : '-100%';
      AE.els.detailImg.style.transform = 'translateX(' + exitX + ')';
      AE.els.detailImg.style.opacity = '0';

      setTimeout(function() {
        AE.els.detailImg.style.transition = 'none';
        AE.els.detailImg.style.transform = 'translateX(' + (diff > 0 ? '-100%' : '100%') + ')';
        AE.navigate(direction);

        requestAnimationFrame(function() {
          requestAnimationFrame(function() {
            AE.els.detailImg.style.transition = '';
            AE.els.detailImg.style.transform = 'translateX(0)';
            AE.els.detailImg.style.opacity = '1';
          });
        });
      }, 200);
    } else {
      // Snap back
      AE.els.detailImg.style.transform = 'translateX(0)';
      AE.els.detailImg.style.opacity = '1';
    }
  }

  // Initialize keyboard navigation
  AE.initKeyboardNav = function() {
    document.addEventListener('keydown', function(e) {
      if (!AE.els.detail.classList.contains('active')) return;
      if (e.key === 'ArrowLeft') AE.navigate(-1);
      if (e.key === 'ArrowRight') AE.navigate(1);
      if (e.key === 'Escape') AE.closeDetail();
    });
  };

  // Initialize touch navigation
  AE.initTouchNav = function() {
    AE.els.detail.addEventListener('touchstart', function(e) {
      if (e.target.closest('.nav-btn, .close-btn, .tag')) return;
      startDrag(e.touches[0].clientX);
    }, { passive: true });

    AE.els.detail.addEventListener('touchmove', function(e) {
      moveDrag(e.touches[0].clientX);
    }, { passive: true });

    AE.els.detail.addEventListener('touchend', endDrag);
    AE.els.detail.addEventListener('touchcancel', endDrag);
  };

  // Initialize mouse drag navigation
  AE.initMouseNav = function() {
    AE.els.detail.addEventListener('mousedown', function(e) {
      if (e.target.closest('.nav-btn, .close-btn, .tag')) return;
      if (!AE.els.detail.classList.contains('active')) return;
      e.preventDefault();
      startDrag(e.clientX);
    });

    document.addEventListener('mousemove', function(e) {
      if (isDragging) {
        e.preventDefault();
        moveDrag(e.clientX);
      }
    });

    document.addEventListener('mouseup', endDrag);
  };

  // Initialize mouse wheel navigation
  AE.initWheelNav = function() {
    var wheelTimeout = null;

    AE.els.detail.addEventListener('wheel', function(e) {
      if (!AE.els.detail.classList.contains('active')) return;
      e.preventDefault();
      if (wheelTimeout) return;

      wheelTimeout = setTimeout(function() {
        wheelTimeout = null;
      }, 300);

      if (e.deltaY > 0 || e.deltaX > 0) {
        AE.navigate(1);
      } else {
        AE.navigate(-1);
      }
    }, { passive: false });
  };

  // Initialize all navigation handlers
  AE.initNavigation = function() {
    AE.initKeyboardNav();
    AE.initTouchNav();
    AE.initMouseNav();
    AE.initWheelNav();
  };
})(AnimalExplorer);
