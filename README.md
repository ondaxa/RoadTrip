# Route Log — a road trip planner

Plan a trip on a map: drop stops in any order and they thread themselves into a
route, get drive times, fuel stops, breaks, weather along each day's drive, and a
budget. Everything is saved in your own browser — there is no account and no server.

**Live at:** https://YOUR-DOMAIN-HERE

---

## Putting this on GitHub Pages

Nothing here needs building. It's plain HTML, CSS and JavaScript.

### 1. Make the repository

On GitHub, click **+ → New repository**.

- **Name:** anything — `roadtrip` is fine
- **Public** — on a free account, GitHub Pages only publishes from public repos.
  Your trip data is never in the repo (it lives in your browser), so this only
  makes the app's code visible.
- Don't tick "Add a README" — there's one here already.
- **Create repository**

### 2. Upload these files

On the empty repo page, click **uploading an existing file**.

Drag in **the contents of this folder** — the files themselves, not the folder
around them. `index.html` has to end up at the top level of the repo, not inside
a subfolder, or the site won't load.

⚠️ **`.nojekyll` is easy to miss.** It's a hidden file. On a Mac, press
**⌘ + Shift + .** in the file dialog to reveal hidden files, then include it.
Without it GitHub runs the site through Jekyll, its blog engine, which can quietly
drop or mangle files. It's an empty file whose only job is to say "don't do that."

Then **Commit changes** at the bottom.

### 3. Turn Pages on

**Settings → Pages** (left sidebar).

- **Source:** Deploy from a branch
- **Branch:** `main`, folder `/ (root)` → **Save**

Give it a minute, then reload the page — GitHub shows the live URL, something like
`https://yourname.github.io/roadtrip/`. Open it and check the app works.

### 4. Point your domain at it

Still in **Settings → Pages**, under **Custom domain**, type your domain and
**Save**. GitHub adds a `CNAME` file to the repo for you.

Then at your registrar, create these records:

**For the root domain** (`example.com`) — four A records, all on host `@`:

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

Optionally add the IPv6 equivalents as AAAA records on `@`:
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`

**For www:**

| Type | Host | Value |
|---|---|---|
| CNAME | `www` | `yourname.github.io` |

(Use your GitHub username, and note the trailing `.github.io` — not the repo name.)

DNS usually takes minutes, occasionally up to a day. Once GitHub sees the records,
go back to **Settings → Pages** and tick **Enforce HTTPS**. The certificate is free
and automatic, but the tickbox only appears once DNS resolves.

### 5. Install it on your phone

Open the domain on your phone, then:

- **iPhone (Safari):** Share → Add to Home Screen
- **Android (Chrome):** ⋮ → Install app

It opens full screen and works with no signal.

---

## Making changes later

Edit `index.html` directly on GitHub (open the file → pencil icon → Commit), or
clone the repo and work locally. Every commit republishes the site in a minute or
two, and you can see or undo any change you've ever made.

**When you change anything, bump `VERSION` at the top of `sw.js`** — `routelog-v1`
becomes `routelog-v2`, and so on. That retires the old offline caches. People with
the app open get a *"A newer version is ready — Reload"* bar instead of being stuck
on the old copy.

---

## What works with no signal

The first visit caches the app; after that it opens offline every time. Also kept
as you use them:

- **Map tiles** you've already looked at — capped at about 1,200, oldest dropped
  first, so it can't quietly fill your phone
- **Routes and drive times** already fetched
- **Weather** already fetched

A bar appears along the bottom when you lose signal, and again when you're back on.

Your trip lives in your browser's storage. It is never uploaded anywhere. That also
means it doesn't follow you between devices — use **Copy share link** or
**Export data** to move a trip from your laptop to your phone.

---

## What's in here

```
index.html         the whole app — one file, no build step
sw.js              service worker: offline caching
manifest.json      makes it installable on a phone
.nojekyll          tells GitHub to publish the files as-is (don't delete)
favicon.ico
icons/             app icons (standard, Android maskable, Apple touch)
vendor/leaflet/    the map library, bundled so the app never depends on a CDN
```

## The map services it uses

Free and no key needed: **OSRM** for routing, **Nominatim** for place lookup,
**OpenStreetMap** for tiles, **Open-Meteo** for weather.

That's well within fair use for you and family. If the site ever picks up real
traffic those services will rate-limit it — they're donation-funded and their terms
say so. If that happens: paste a **Mapbox token** into the box under the map (the
app prefers Mapbox when a token is present, and you get live traffic in the drive
times), and switch the tile URL in `index.html` to a paid provider. Nothing to do
today.
