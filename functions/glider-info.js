export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);
  const deviceId = searchParams.get('id');
  if (!deviceId) return new Response('Missing id', { status: 400 });

  try {
    const res  = await fetch(
      `https://ddb.glidernet.org/download/?t=1&j=1&k=${deviceId.toUpperCase()}`,
      { headers: { 'User-Agent': 'OGN-Map/1.0' } }
    );
    const data = await res.json();
    const match = data.devices && data.devices.find(d =>
      d.device_id && d.device_id.toUpperCase() === deviceId.toUpperCase()
    );
    return new Response(JSON.stringify(match || null), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      }
    });
  } catch(e) {
    return new Response('null', { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
}
