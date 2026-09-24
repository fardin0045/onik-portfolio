// Applies the saved/default colour theme before first paint (avoids a flash of the wrong theme).
(function () {
  try {
    var saved = localStorage.getItem('theme');
    var def = localStorage.getItem('theme-default') || 'dark';
    var pref = saved || def;
    if (pref === 'system') pref = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', pref);
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
