// config.js — repo-root config.json: which pages ship, bootloader behavior.
//
// build.js applies it (drops disabled pages from the shell, injects
// window.SITE), prerender.js skips disabled pages, validate.js gates it.
// Missing file, bad JSON, unknown pages or wrong types fail the build.

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const KNOWN_PAGES = ['blog', 'projects', 'skills', 'work'];

function loadConfig() {
  const file = path.join(root, 'config.json');
  if (!fs.existsSync(file)) throw new Error('config.json missing at repo root');
  let cfg;
  try {
    cfg = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (e) {
    throw new Error('config.json is not valid JSON — ' + e.message);
  }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new Error('config.json must be an object');
  }

  const bl = cfg.bootloader;
  if (!bl || typeof bl !== 'object') throw new Error('config.json: bootloader must be an object');
  if (typeof bl.loaderEnable !== 'boolean') throw new Error('config.json: bootloader.loaderEnable must be a bool');
  if (typeof bl.defaultDuration !== 'number' || !(bl.defaultDuration >= 0)) {
    throw new Error('config.json: bootloader.defaultDuration must be a number >= 0');
  }

  const pages = cfg.pages;
  if (!pages || typeof pages !== 'object') throw new Error('config.json: pages must be an object');
  for (const k of Object.keys(pages)) {
    if (!KNOWN_PAGES.includes(k)) throw new Error('config.json: unknown page "' + k + '"');
    if (typeof pages[k] !== 'boolean') throw new Error('config.json: pages.' + k + ' must be a bool');
  }

  const th = cfg.theme;
  if (!th || typeof th !== 'object') throw new Error('config.json: theme must be an object');
  if (th.defaultTheme !== 'dark' && th.defaultTheme !== 'light') {
    throw new Error('config.json: theme.defaultTheme must be "dark" or "light"');
  }

  // omitted pages default to on
  const enabled = KNOWN_PAGES.filter((p) => pages[p] !== false);
  return {
    bootloader: { loaderEnable: bl.loaderEnable, defaultDuration: bl.defaultDuration },
    theme: { defaultTheme: th.defaultTheme },
    pages: Object.fromEntries(KNOWN_PAGES.map((p) => [p, pages[p] !== false])),
    enabled,
  };
}

module.exports = { root, KNOWN_PAGES, loadConfig };
