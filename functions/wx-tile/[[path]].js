// functions/wx-tile/[[path]].js
//
// Cloudflare Pages Function — proxies OpenWeatherMap tile requests.
// The [[path]] catch-all captures the /{z}/{x}/{y} segments.
//
// Deployed at:  /wx-tile/{z}/{x}/{y}?layer=clouds_new
// Forwards to:  https://tile.openweathermap.org/map/{layer}/{z}/{x}/{y}.png?appid=SECRET
//
// Your API key is stored as a Cloudflare Pages environment variable: OWM_API_KEY
// It never appears in client-side code or browser network logs.

const ALLOWED_LAYERS = new Set([
  'clouds_new',
  'precipitation_new',
  'wind_new',
  'temp_new',
  'pressure_new',
]);

export async function onRequestGet(context) {
  // context.env holds Cloudflare Pages environment variables (set in dashboard)
  const OWM_KEY = context.env.OWM_API_KEY || 'a2fc87a9c419ef769bb753b36a86c08f';

  if (!OWM_KEY) {
    return new Response('OWM_API_KEY environment variable is not configured.', { status: 500 });
  }

  // context.params.path is an array of path segments from [[path]]
  // e.g. for /wx-tile/7/65/42 → ['7', '65', '42']
  const segments = context.params.path ?? [];

  if (segments.length !== 3) {
    return new Response('Path must be /wx-tile/{z}/{x}/{y}', { status: 400 });
  }

  const [z, x, y] = segments;
  const { searchParams } = new URL(context.request.url);
  const layer = searchParams.get('layer') ?? 'clouds_new';

  if (!ALLOWED_LAYERS.has(layer)) {
    return new Response(`Unknown layer: ${layer}`, { status: 400 });
  }

  // Validate tile coords
  if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
    return new Response('Invalid tile coordinates', { status: 400 });
  }

  const owmUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${OWM_KEY}`;

  try {
    const res = await fetch(owmUrl, { signal: AbortSignal.timeout(8000) });

    if (!res.ok) {
      return new Response(`OWM upstream error: ${res.status}`, { status: res.status });
    }

    // Stream the PNG back with cache headers
    return new Response(res.body, {
      status: 200,
      headers: {
        'Content-Type':  'image/png',
        'Cache-Control': 'public, max-age=600',   // cache tiles for 10 min
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    return new Response(`Proxy error: ${err.message}`, { status: 502 });
  }
}
