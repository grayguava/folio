/* ── simple quote system ── */

var QUOTES = {
  networking: [
    { text: "the network is the computer", attr: "sun microsystems" },
    { text: "ip is just addresses. routing is the interesting part.", attr: "vint cerf" },
    { text: "everything is a file descriptor. everything is a stream of bytes.", attr: "unix philosophy" },
    { text: "layer 8: the user layer. where all problems actually originate.", attr: "unknown" },
    { text: "packets don't lie, but they can be delayed, duplicated, or dropped.", attr: "network wisdom" },
  ],
  security: [
    { text: "security is not a product, but a process.", attr: "bruce schneier" },
    { text: "the only secure system is one that is powered off, unplugged, and locked in a vault.", attr: "unknown" },
    { text: "if you think technology can solve your security problems, then you don't understand the problems.", attr: "bruce schneier" },
    { text: "attacks always get better, they never get worse.", attr: "unknown" },
    { text: "there are two types of companies: those that have been hacked and those that don't know yet.", attr: "john chambers" },
  ],
  systems: [
    { text: "simplicity is the soul of efficiency.", attr: "unknown" },
    { text: "there is no spoon. there is no silver bullet. there is only hard work.", attr: "unknown" },
    { text: "premature optimization is the root of all evil.", attr: "donald knuth" },
    { text: "the best code is no code. the second best is code that is clear and simple.", attr: "unknown" },
    { text: "build it right, then build it fast. not the other way around.", attr: "unknown" },
  ],
  funTech: [
    { text: "it works on my machine is not a valid bug report.", attr: "unknown" },
    { text: "sudo rm -rf / is not a joke. it's a career ender.", attr: "unknown" },
    { text: "documentation? we don't need no stinking documentation.", attr: "developer folklore" },
    { text: "tcp is reliable. userland is not.", attr: "network saying" },
  ],
};

window.loadQuote = function() {
  if (window.__quoteLoaded) return;
  window.__quoteLoaded = true;

  var categories = Object.keys(QUOTES);
  var category = categories[Math.floor(Math.random() * categories.length)];
  var quotes = QUOTES[category];
  var idx = Math.floor(Math.random() * quotes.length);
  var q = quotes[idx];

  var el = document.getElementById('footer-quote');
  if (el) {
    el.innerHTML = '<span class="quote-text">"' + q.text + '"</span><span class="quote-attr">— ' + q.attr + '</span>';
  }
};