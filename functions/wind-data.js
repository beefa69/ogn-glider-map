// functions/wind-data.js
// Returns wind speed + direction for a lat/lng point from OWM Current Weather API
// Called by the wind arrows layer in index.html

export async function onRequestGet(context) {
  const OWM_KEY = context.env.OWM_API_KEY || 'a2fc87a9c419ef769bb753b36a86c08f';

  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return new Response('Missing lat/lon', { status: 400 });
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWM_KEY}&units=metric`;

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return new Response(`OWM error: ${res.status}`, { status: res.status });

    const data = await res.json();
    const wind = data.wind || {};

    return new Response(
      JSON.stringify({
        speed: wind.speed ?? 0,   // m/s
        deg:   wind.deg   ?? 0,   // degrees (meteorological: direction FROM)
        gust:  wind.gust  ?? null,
      }),
      {
        status: 200,
        headers: {
          'Content-Type':  'application/json',
          'Cache-Control': 'public, max-age=300', // cache 5 min
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(`Error: ${err.message}`, { status: 502 });
  }
}
