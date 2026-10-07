// ── custom slug parser (ini-like) ──

function parseSlug(text) {
  var lines = text.split('\n');
  var sections = [];
  var current = null;
  var kv = {};

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === ';') continue;

    if (line.charAt(0) === '[') {
      var close = line.indexOf(']');
      if (close === -1) continue;
      current = { section: line.slice(1, close).trim(), kv: {}, items: [] };
      sections.push(current);
    } else if (current) {
      var eq = line.indexOf('=');
      if (eq !== -1) {
        current.kv[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      } else {
        current.items.push(line);
      }
    } else {
      var eq = line.indexOf('=');
      if (eq !== -1) {
        kv[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
      }
    }
  }

  return { sections: sections, kv: kv };
}

// ── compact minified slug parser (single merged file) ──
// [m:path]           → group marker; everything after belongs to that path
// [name]k=v\ti=j     → section with kv pairs on one line (tab separated)
// [name]item1\titem2 → section with bare items
// k=v\ti=j           → group-level kv (about/pages style)

function parseSlugsMin(text) {
  var groups = {};
  var cur = null;
  var lines = text.split('\n');

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line || line.charAt(0) === ';') continue;

    if (line.slice(0, 3) === '[m:') {
      var close = line.indexOf(']');
      if (close === -1) continue;
      cur = { sections: [], kv: {} };
      groups[line.slice(3, close).trim()] = cur;
      continue;
    }

    var isSection = false;
    var rest = line;
    if (line.charAt(0) === '[') {
      var close = line.indexOf(']');
      if (close === -1 || !cur) continue;
      cur.sections.push({ section: line.slice(1, close).trim(), kv: {}, items: [] });
      rest = line.slice(close + 1).trim();
      isSection = true;
    } else if (!cur) {
      continue;
    }

    var target = isSection ? cur.sections[cur.sections.length - 1] : cur;
    var parts = rest.split('\t');
    for (var j = 0; j < parts.length; j++) {
      var part = parts[j].trim();
      if (!part) continue;
      var eq = part.indexOf('=');
      if (eq !== -1) {
        target.kv[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
      } else {
        target.items.push(part);
      }
    }
  }

  return groups;
}
