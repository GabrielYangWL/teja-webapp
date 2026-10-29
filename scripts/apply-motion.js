// Inlines motion/motion.css + motion/motion.js into the site's <head>.
// Usage: node scripts/apply-motion.js [file ...]   (default: index.html teja-build.dc.html)
// Works on the bundled index.html (edits the JSON-encoded template) and on plain HTML.
// Safe to re-run: the previous injection between the markers is replaced.
const fs = require('fs');
const path = require('path');

const repo = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(repo, 'motion', 'motion.css'), 'utf8');
const js = fs.readFileSync(path.join(repo, 'motion', 'motion.js'), 'utf8');
const START = '<!--teja-motion-->', END = '<!--/teja-motion-->';
const block = `${START}<style>\n${css}</style><script>\n${js}</script>${END}\n`;

function inject(html) {
  const s = html.indexOf(START);
  if (s >= 0) html = html.slice(0, s) + html.slice(html.indexOf(END, s) + END.length + 1);
  const head = html.indexOf('</head>');
  if (head < 0) throw new Error('no </head> found');
  return html.slice(0, head) + block + html.slice(head);
}

const TPL_OPEN = '<script type="__bundler/template">';
const files = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'teja-build.dc.html'];

for (const f of files) {
  const file = path.resolve(repo, f);
  if (!fs.existsSync(file)) { console.log(`skip ${f} (not found)`); continue; }
  const src = fs.readFileSync(file, 'utf8');
  let out;
  const t = src.indexOf(TPL_OPEN);
  if (t >= 0) {
    // Bundle: the page lives as a JSON string inside a <script> tag
    const a = t + TPL_OPEN.length, b = src.indexOf('</script>', a);
    const tpl = inject(JSON.parse(src.slice(a, b)));
    // Escape '<' so nothing in the template can close or confuse the outer <script>
    const json = JSON.stringify(tpl).replace(/</g, '\\u003c');
    out = src.slice(0, a) + '\n' + json + '\n  ' + src.slice(b);
  } else {
    out = inject(src);
  }
  fs.writeFileSync(file, out);
  console.log(`motion applied to ${f}`);
}
