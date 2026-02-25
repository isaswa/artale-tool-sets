(function () {
  'use strict';

  var THEME_KEYS = ['theme', 'artale_theme', 'nshot-theme'];

  function getStoredTheme() {
    for (var i = 0; i < THEME_KEYS.length; i++) {
      var val = localStorage.getItem(THEME_KEYS[i]);
      if (val === 'light' || val === 'dark') return val;
    }
    return 'dark';
  }

  function setAllThemeKeys(value) {
    for (var i = 0; i < THEME_KEYS.length; i++) {
      localStorage.setItem(THEME_KEYS[i], value);
    }
  }

  function initTheme() {
    var theme = getStoredTheme();

    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    document.documentElement.classList.remove('light-early');

    setAllThemeKeys(theme);

    var btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', '\u5207\u63DB\u4E3B\u984C');

    var icon = document.createElement('span');
    icon.className = 'theme-icon';
    icon.textContent = theme === 'light' ? '\u{1F319}' : '\u2600\uFE0F';
    btn.appendChild(icon);

    btn.addEventListener('click', function () {
      var nowLight = document.body.classList.toggle('light-theme');
      var newTheme = nowLight ? 'light' : 'dark';
      setAllThemeKeys(newTheme);
      icon.textContent = nowLight ? '\u{1F319}' : '\u2600\uFE0F';
    });

    document.body.insertBefore(btn, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }
})();
