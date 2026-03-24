export async function onRequestGet(context) {
  const OWM_KEY = context.env.OWM_API_KEY;
  const { searchParams } = new URL(context.request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  if (!lat || !lon) return new Response('Missing lat/lon', { status: 400 });

  const url = `https://api.openweathermap.org/data/2.5/wind?lat=${lat}&lon=${lon}&appid=${OWM_KEY}`;
  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return new Response(`OWM error: ${res.status}`, { status: res.status });
    const data = await res.json();
    return new Response(
      JSON.stringify({ speed: data.speed ?? 0, deg: data.deg ?? 0 }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' } }
    );
  } catch(e) {
    return new Response(JSON.stringify({ speed: 0, deg: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
