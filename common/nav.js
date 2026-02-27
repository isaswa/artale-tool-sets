(function () {
  'use strict';

  var ICONS = {
    exp: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>',
    event: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    nshot: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="22" y1="12" x2="18" y2="12"></line><line x1="6" y1="12" x2="2" y2="12"></line><line x1="12" y1="6" x2="12" y2="2"></line><line x1="12" y1="22" x2="12" y2="18"></line></svg>',
    home: '<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
  };

  var TOOLS = [
    { id: 'exp', path: 'artale-exp-time-calculator', name: '\u7D93\u9A57\u503C\u6642\u9593\u6548\u7387\u8A08\u7B97\u6A5F' },
    { id: 'event', path: 'artale-event-tracker', name: '\u6D3B\u52D5\u9053\u5177\u8A08\u7B97\u6A5F' },
    { id: 'nshot', path: 'artale-mob-n-shot-calculator', name: '\u64CA\u6BBA\u6B21\u6578\u8A08\u7B97\u6A5F' }
  ];

  var DESKTOP_BREAKPOINT = 769;
  var NAV_PINNED_KEY = 'artale_nav_pinned';

  function getPathPrefix() {
    var tool = document.body.dataset.tool;
    if (tool === 'home') return './';
    return '../';
  }

  function isDesktop() {
    return window.innerWidth >= DESKTOP_BREAKPOINT;
  }

  function createNavLink(iconHtml, labelText, href, isActive, toolId) {
    var a = document.createElement('a');
    a.className = 'nav-link';
    if (isActive) a.className += ' active';
    a.href = href;
    a.title = labelText;
    if (toolId) a.dataset.tool = toolId;

    var label = '<span class="nav-label">' + labelText + '</span>';
    a.innerHTML = iconHtml + label;

    return a;
  }

  function initNav() {
    var currentTool = document.body.dataset.tool || '';
    var prefix = getPathPrefix();

    // Hamburger button
    var hamburger = document.createElement('button');
    hamburger.className = 'nav-hamburger';
    hamburger.id = 'navHamburger';
    hamburger.setAttribute('aria-label', '\u5DE5\u5177\u9078\u55AE');

    var lines = document.createElement('div');
    lines.className = 'nav-hamburger-lines';
    for (var i = 0; i < 3; i++) {
      lines.appendChild(document.createElement('span'));
    }
    hamburger.appendChild(lines);

    // Backdrop
    var backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    backdrop.id = 'navBackdrop';

    // Sidebar
    var sidebar = document.createElement('nav');
    sidebar.className = 'nav-sidebar';
    sidebar.id = 'navSidebar';

    // Sidebar header
    var header = document.createElement('div');
    header.className = 'nav-sidebar-header';

    var title = document.createElement('a');
    title.className = 'nav-sidebar-title';
    title.textContent = 'Artale \u5DE5\u5177\u96C6';
    title.href = prefix;
    title.style.textDecoration = 'none';
    title.style.color = 'inherit';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'nav-sidebar-close';
    closeBtn.id = 'navClose';
    closeBtn.setAttribute('aria-label', '\u95DC\u9589');
    closeBtn.innerHTML = '&times;';

    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebar.appendChild(header);

    // Nav list
    var ul = document.createElement('ul');
    ul.className = 'nav-sidebar-list';

    for (var j = 0; j < TOOLS.length; j++) {
      var tool = TOOLS[j];
      var li = document.createElement('li');
      var a = createNavLink(
        ICONS[tool.id],
        tool.name,
        prefix + tool.path + '/',
        tool.id === currentTool,
        tool.id
      );
      li.appendChild(a);
      ul.appendChild(li);
    }

    sidebar.appendChild(ul);

    // Home link at bottom
    var homeSection = document.createElement('div');
    homeSection.className = 'nav-sidebar-home';
    var homeUl = document.createElement('ul');
    homeUl.className = 'nav-sidebar-list';
    var homeLi = document.createElement('li');
    var homeLink = createNavLink(
      ICONS.home,
      '\u9996\u9801',
      prefix,
      currentTool === 'home',
      null
    );
    homeLi.appendChild(homeLink);
    homeUl.appendChild(homeLi);
    homeSection.appendChild(homeUl);
    sidebar.appendChild(homeSection);

    // Insert into DOM
    document.body.insertBefore(hamburger, document.body.firstChild);
    document.body.insertBefore(backdrop, document.body.firstChild);
    document.body.insertBefore(sidebar, document.body.firstChild);

    // --- Desktop: pinned toggle ---
    function pinNav() {
      sidebar.classList.add('pinned');
      document.body.classList.add('nav-pinned');
      localStorage.setItem(NAV_PINNED_KEY, 'true');
    }

    function unpinNav() {
      sidebar.classList.remove('pinned');
      document.body.classList.remove('nav-pinned');
      localStorage.setItem(NAV_PINNED_KEY, 'false');
    }

    // --- Mobile: overlay ---
    function openNav() {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
    }

    function closeNav() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    }

    // Hamburger: toggle on desktop, overlay on mobile
    hamburger.addEventListener('click', function () {
      if (isDesktop()) {
        if (sidebar.classList.contains('pinned')) {
          unpinNav();
        } else {
          pinNav();
        }
      } else {
        openNav();
      }
    });

    // Mobile: backdrop and close button dismiss overlay
    backdrop.addEventListener('click', closeNav);
    closeBtn.addEventListener('click', closeNav);

    // Close overlay on nav link click (mobile only)
    var links = sidebar.querySelectorAll('.nav-link');
    for (var k = 0; k < links.length; k++) {
      links[k].addEventListener('click', function () {
        if (!isDesktop()) {
          closeNav();
        }
      });
    }

    // Restore pinned state on desktop
    if (isDesktop() && localStorage.getItem(NAV_PINNED_KEY) === 'true') {
      pinNav();
    }

    // Handle viewport resize across breakpoint
    var prevDesktop = isDesktop();
    window.addEventListener('resize', function () {
      var nowDesktop = isDesktop();
      if (nowDesktop === prevDesktop) return;
      prevDesktop = nowDesktop;

      if (nowDesktop) {
        // Switched to desktop: close mobile overlay, restore pinned state
        closeNav();
        if (localStorage.getItem(NAV_PINNED_KEY) === 'true') {
          pinNav();
        }
      } else {
        // Switched to mobile: remove pinned state
        sidebar.classList.remove('pinned');
        document.body.classList.remove('nav-pinned');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
