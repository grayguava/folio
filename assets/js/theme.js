/* ── theme toggle ── */

(function() {
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) return;

  var saved = localStorage.getItem('theme');
  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  var theme = saved || (prefersDark ? 'dark' : 'dark');
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.querySelector('.icon-sun').style.display = 'none';
    document.querySelector('.icon-moon').style.display = 'block';
  }

  toggle.addEventListener('click', function() {
    var current = document.documentElement.getAttribute('data-theme');
    var sun = document.querySelector('.icon-sun');
    var moon = document.querySelector('.icon-moon');
    if (current === 'light') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      sun.style.display = 'block';
      moon.style.display = 'none';
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      sun.style.display = 'none';
      moon.style.display = 'block';
    }
  });
})();