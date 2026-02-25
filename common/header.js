(function () {
  'use strict';

  function initHeader() {
    var title = document.body.dataset.toolTitle || 'Artale \u5DE5\u5177\u96C6';

    var header = document.createElement('header');
    header.className = 'common-header';

    var h1 = document.createElement('h1');
    h1.textContent = title;
    header.appendChild(h1);

    // Insert as first visible element (after any injected nav/theme buttons)
    var firstChild = document.body.firstChild;
    document.body.insertBefore(header, firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeader);
  } else {
    initHeader();
  }
})();
