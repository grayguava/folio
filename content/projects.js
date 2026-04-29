var PROJECTS = [
  {
    title: 'formseal ecosystem',
    role: 'creator',
    description: 'form backend with multiple storage providers — cloudflare kv, supabase, redis. includes fsf (cli fetch) and fse (self-hosted embed).',
    href: 'https://github.com/polymercistern/formseal',
    tags: ['go', 'cloudflare', 'redis', 'supabase'],
  },
  {
    title: 'libreprobe',
    role: 'creator',
    description: 'self-hosted network probing and uptime testing tool. run your own monitors without phoning home.',
    href: 'https://github.com/polymercistern/libreprobe',
    tags: ['go', 'sqlite', 'docker'],
  },
  {
    title: 'dnsq',
    role: 'creator',
    description: 'fast dns query cli. inspect records, trace delegations, debug resolvers.',
    href: 'https://github.com/polymercistern/dnsq',
    tags: ['go', 'networking'],
  },
  {
    title: 'byteseal',
    role: 'creator',
    description: 'browser-only offline file encryption. no server, no uploads, no tracking.',
    href: 'https://github.com/polymercistern/byteseal',
    tags: ['js', 'webcrypto'],
  },
];















// functions
function renderItem(p) {
  var el = document.createElement('a');
  el.className = 'item';
  el.href = p.href || '#';
  if (p.href) {
    el.target = '_blank';
    el.rel = 'noopener';
  }

  var tagsHtml = '';
  if (p.tags && p.tags.length) {
    tagsHtml = '<div class="item-tags">' + p.tags.map(function(t) {
      return '<span class="item-tag">' + t + '</span>';
    }).join('') + '</div>';
  }

  el.innerHTML =
    '<div class="item-body">' +
      '<div class="item-title">' + p.title + '</div>' +
      '<div class="item-meta">' + p.role + '</div>' +
      '<div class="item-desc">' + p.description + '</div>' +
      tagsHtml +
    '</div>' +
    '<div class="item-arrow">↗</div>';
  return el;
}