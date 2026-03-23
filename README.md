# OGN Live Glider Map — Cloudflare Pages

Live glider tracking (OGN) + weather overlays (OpenWeatherMap) on a Leaflet map.
Deployed on Cloudflare Pages with Pages Functions for server-side proxying.

## Project Structure

```
ogn-map/
├── index.html                          # Leaflet map (static)
├── wrangler.toml                       # Cloudflare Pages config
└── functions/
    ├── ogn-proxy.js                    # → /ogn-proxy       (OGN data, fixes CORS)
    └── wx-tile/
        └── [[path]].js                 # → /wx-tile/{z}/{x}/{y}  (OWM tiles, hides key)
```

## Deploy

### 1. Add your API key in Cloudflare

Dashboard → Pages → your project → **Settings → Environment variables → Add variable**:

| Variable name | Value |
|---|---|
| `OWM_API_KEY` | `your_key_here` |

Add it for both **Production** and **Preview** environments.
**Never put the key in code or commit it to git.**

### 2a. Deploy via Git (recommended)

Push this folder to a GitHub/GitLab repo, then in Cloudflare:
- Pages → Create a project → Connect to Git → select your repo
- Build command: *(leave empty)*
- Build output directory: `.`

Cloudflare auto-deploys on every push.

### 2b. Deploy via Wrangler CLI

```bash
npm i -g wrangler
wrangler pages deploy . --project-name ogn-glider-map
```

## How It Works

### OGN Proxy (`/ogn-proxy`)
The browser polls `/ogn-proxy?latMin=…&latMax=…&lngMin=…&lngMax=…` every 12 seconds.
The Pages Function fetches `live.glidernet.org` server-side, parses the XML, and returns JSON.
This sidesteps the CORS restriction on OGN's endpoint.

### Weather Tile Proxy (`/wx-tile/{z}/{x}/{y}?layer=…`)
Leaflet requests tiles via the Pages Function catch-all `[[path]]`.
The function reads `OWM_API_KEY` from the environment, appends it to the OWM URL, and streams the PNG back.
The API key never appears in the browser.

### Why Cloudflare Pages Functions vs Workers?
Pages Functions live in the `/functions` directory and are scoped to your Pages site — no separate Worker deployment needed. The `[[path]]` filename syntax creates a catch-all route that captures `/wx-tile/7/65/42` → `params.path = ['7', '65', '42']`.

## Weather Layers

| Button | OWM layer key | Description |
|---|---|---|
| Cloud Cover | `clouds_new` | Cloud density % |
| Precipitation | `precipitation_new` | Rain/snow rate |
| Wind Speed | `wind_new` | Surface wind |
| Temperature | `temp_new` | Surface temperature |
| Pressure | `pressure_new` | Sea-level pressure |

Click any button to toggle the overlay. Click again to turn off.

## OGN Data Policy

Please respect the [OGN data usage terms](http://wiki.glidernet.org/wiki:ogn-data-usage-terms).
