/* ── theme toggle ── */

(function() {
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  var theme = saved || (prefersDark ? 'dark' : 'dark');
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    toggle.textContent = '◑';
  }

  toggle.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      toggle.textContent = '◐';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      toggle.textContent = '◑';
    }
  });
})();