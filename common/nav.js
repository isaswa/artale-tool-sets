(function () {
  'use strict';

  var TOOLS = [
    { id: 'exp', path: 'artale-exp-time-calculator', name: '\u7D93\u9A57\u503C\u6642\u9593\u6548\u7387\u8A08\u7B97\u6A5F' },
    { id: 'event', path: 'artale-event-tracker', name: '\u6D3B\u52D5\u9053\u5177\u8A08\u7B97\u6A5F' },
    { id: 'nshot', path: 'artale-mob-n-shot-calculator', name: '\u64CA\u6BBA\u6B21\u6578\u8A08\u7B97\u6A5F' }
  ];

  function getPathPrefix() {
    var tool = document.body.dataset.tool;
    if (tool === 'home') return './';
    return '../';
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
      var a = document.createElement('a');
      a.className = 'nav-link';
      if (tool.id === currentTool) a.className += ' active';
      a.href = prefix + tool.path + '/';
      a.dataset.tool = tool.id;
      a.textContent = tool.name;
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
    var homeLink = document.createElement('a');
    homeLink.className = 'nav-link';
    if (currentTool === 'home') homeLink.className += ' active';
    homeLink.href = prefix + (currentTool === 'home' ? '' : '');
    homeLink.href = prefix;
    homeLink.textContent = '\u2190 \u9996\u9801';
    homeLi.appendChild(homeLink);
    homeUl.appendChild(homeLi);
    homeSection.appendChild(homeUl);
    sidebar.appendChild(homeSection);

    // Insert into DOM
    document.body.insertBefore(hamburger, document.body.firstChild);
    document.body.insertBefore(backdrop, document.body.firstChild);
    document.body.insertBefore(sidebar, document.body.firstChild);

    // Event handlers
    function openNav() {
      sidebar.classList.add('open');
      backdrop.classList.add('active');
    }

    function closeNav() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('active');
    }

    hamburger.addEventListener('click', openNav);
    backdrop.addEventListener('click', closeNav);
    closeBtn.addEventListener('click', closeNav);

    // Close on nav link click
    var links = sidebar.querySelectorAll('.nav-link');
    for (var k = 0; k < links.length; k++) {
      links[k].addEventListener('click', function () {
        closeNav();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNav);
  } else {
    initNav();
  }
})();
