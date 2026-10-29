# téja — static site

Self-contained build: `index.html` has all images, fonts-links and scripts inlined.
(Stock lifestyle photos still load from Unsplash.)

## Host from your teja-webapp folder + push to GitHub

1. Put `index.html` (and this README) in `teja-webapp/`.
2. In a terminal:

```
cd teja-webapp
git init
git add .
git commit -m "téja site"
git branch -M main
git remote add origin https://github.com/<you>/teja-webapp.git
git push -u origin main
```

3. Free hosting: GitHub repo → Settings → Pages → Source: `main` / root → Save.
   Site goes live at https://<you>.github.io/teja-webapp/
