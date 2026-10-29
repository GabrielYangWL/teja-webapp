# téja — static site

Storefront for téja: 925 sterling silver bracelets, handmade in Bali.

**Live:** https://gabrielyangwl.github.io/teja-webapp/

`index.html` is a self-contained bundle: images, fonts and scripts are inlined, and the page
unpacks itself in the browser. The only external requests are a few Unsplash stock photos.

## Project layout

| Path | What it is |
| --- | --- |
| `index.html` | The deployed site (self-unpacking bundle). |
| `teja-build.dc.html` | Editable source the bundle is built from. |
| `support.js` | Runtime used by `teja-build.dc.html` when opened directly. |
| `motion/motion.css`, `motion/motion.js` | Splash screen ("Welcome to téja") and motion effects. |
| `scripts/apply-motion.js` | Inlines the `motion/` files into `index.html` and `teja-build.dc.html`. |
| `tests/e2e/` | Playwright end-to-end tests. |
| `tests/serve.js` | Tiny static server for local preview and tests. |

## Run locally

Requires Node.js 18+.

```
npm install
npm run serve
```

Then open http://localhost:4173. Opening `index.html` directly from disk also works.

## Splash screen and motion

On load, a splash shows "Welcome to" above the téja logo, then lifts like a curtain to reveal the
page. After that, sections fade up as they scroll into view, the hero image drifts gently on scroll,
product photos push in slowly on hover and the bag slides in from the right. Visitors with
"reduce motion" enabled get a brief static splash and no animation.

The effects live in `motion/`. After editing them, or after re-exporting `index.html` from the
design tool, re-apply them:

```
npm run apply-motion
```

It is safe to run repeatedly; it replaces its previous injection.

## End-to-end tests

Playwright tests cover the splash screen, navigation, collection filters and sorting, the bag,
the full checkout flow, image loading, horizontal overflow and scroll reveals, on desktop and
mobile Chromium. Any uncaught error or console error fails a test.

First-time setup:

```
npm install
npx playwright install chromium
```

Run:

```
npm run test:e2e          # headless, all tests
npm run test:e2e:ui       # interactive UI mode
npm run test:e2e:report   # open the last HTML report
```

The tests start `tests/serve.js` on port 4173 automatically.

**Known quirk:** while unpacking, the bundle briefly puts the raw template in the page, so the
browser requests a few literal `{{ … }}` image URLs that 404. It is harmless to visitors; the
tests deliberately ignore those requests (see `tests/e2e/fixtures.js`).

## Deploy

GitHub Pages serves `main` from the repository root. Push to `main` and the site updates within
a minute or two:

```
git push origin main
```

Pages settings: repo → Settings → Pages → Source: *Deploy from a branch*, `main`, `/ (root)`.
