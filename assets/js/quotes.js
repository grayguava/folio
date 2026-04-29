/* ── weighted quote system ── */

var CATEGORY_WEIGHTS = [
  { name: 'networking', weight: 30 },
  { name: 'security', weight: 25 },
  { name: 'systems', weight: 25 },
  { name: 'fun-tech', weight: 20 },
];

var quoteCache = {};

function pickCategory() {
  var total = CATEGORY_WEIGHTS.reduce(function(sum, c) { return sum + c.weight; }, 0);
  var rand = Math.random() * total;
  var cumulative = 0;

  for (var i = 0; i < CATEGORY_WEIGHTS.length; i++) {
    cumulative += CATEGORY_WEIGHTS[i].weight;
    if (rand <= cumulative) {
      return CATEGORY_WEIGHTS[i].name;
    }
  }
  return CATEGORY_WEIGHTS[0].name;
}

function loadQuoteFile(category, callback) {
  if (quoteCache[category]) {
    callback(quoteCache[category]);
    return;
  }

  var script = document.createElement('script');
  script.src = 'content/quotes/' + category + '.js';
  script.onload = function() {
    var quotes = window.QUOTES_DATA;
    quoteCache[category] = quotes;
    callback(quotes);
  };
  script.onerror = function() {
    callback(null);
  };
  document.head.appendChild(script);
}

window.loadQuote = function() {
  var category = pickCategory();
  loadQuoteFile(category, function(quotes) {
    if (!quotes) return;
    var idx = Math.floor(Math.random() * quotes.length);
    var q = quotes[idx];
    var el = document.getElementById('footer-quote');
    if (el) {
      el.innerHTML = '<span class="quote-text">"' + q.text + '"</span><span class="quote-attr">— ' + q.attr + '</span>';
    }
  });
};

window.addEventListener('hashchange', window.loadQuote);