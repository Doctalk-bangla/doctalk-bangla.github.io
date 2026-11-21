# DocTalk বাংলা — website

Static site (no server needed). Hosted free on GitHub Pages.

- `index.html`, `style.css`, `app.js` — the site
- `data/posts.json` — daily posts (the nightly DocTalk run adds new ones)
- `data/alerts.json` — health alert bar
- `data/prices.json` — lab test prices (re-check monthly; keep date + source)
- `data/geo.json` — divisions, districts, upazilas (from nuhil/bangladesh-geocode)
- Settings at the top of `app.js`: Facebook link, survey (Google Sheet) link

Hospital/pharmacy search uses OpenStreetMap (Overpass API) live in the browser.
For awareness only — not medical advice.
