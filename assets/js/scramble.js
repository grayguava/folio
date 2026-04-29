function scramble(el, target, duration) {
  if (!el) return;
  duration = duration || 900;
  var chars = 'abcdefghijklmnopqrstuvwxyz-_#*/\!~{[}]^?.';
  var steps = Math.ceil(duration / 16);
  var frame = 0;

  function tick() {
    var progress = frame / steps;
    var revealed = Math.floor(progress * target.length);
    var out = '';
    for (var i = 0; i < target.length; i++) {
      if (i < revealed) {
        out += target[i];
      } else {
        out += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    el.textContent = out;
    frame++;
    if (frame <= steps) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }

  tick();
}