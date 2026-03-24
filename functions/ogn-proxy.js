// functions/ogn-proxy.js
//
// Cloudflare Pages Function — proxies OGN live data to fix CORS.
// Deployed automatically at: /ogn-proxy
//
// Cloudflare Pages Functions use the standard Web Fetch API (no Node.js built-ins needed).

export async function onRequestGet(context) {
  const { searchParams } = new URL(context.request.url);

  const latMin      = searchParams.get('latMin')      ?? '46';
  const latMax      = searchParams.get('latMax')      ?? '52';
  const lngMin      = searchParams.get('lngMin')      ?? '5';
  const lngMax      = searchParams.get('lngMax')      ?? '16';
  const showOffline = searchParams.get('showOffline') ?? '0';

  const ognUrl =
    `http://live.glidernet.org/lxml.php` +
    `?a=${showOffline}` +
    `&b=${latMax}&c=${latMin}` +
    `&d=${lngMax}&e=${lngMin}`;

  try {
    const res = await fetch(ognUrl, {
      headers: { 'User-Agent': 'OGN-Map-Viewer/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `OGN upstream error: ${res.status}` }), {
        status: 502,
        headers: corsHeaders('application/json'),
      });
    }

    const xml     = await res.text();
    const gliders = parseOgnXml(xml);

    return new Response(
      JSON.stringify({ gliders, fetchedAt: new Date().toISOString(), count: gliders.length }),
      { status: 200, headers: corsHeaders('application/json') }
    );

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders('application/json'),
    });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function corsHeaders(contentType) {
  return {
    'Content-Type': contentType,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  };
}

/**
 * Parse OGN XML marker format into structured objects.
 * Field order: lat, lng, registration, device_id, altitude_m, time_utc,
 *              speed_kmh, heading, climb_rate_ms, ?, aircraft_type, receiver, ?, flarm_id
 */
function parseOgnXml(xml) {
  const gliders = [];
  const re      = /<m\s+a="([^"]+)"\s*\/>/g;
  let match;

  while ((match = re.exec(xml)) !== null) {
    const parts = match[1].split(',');
    if (parts.length < 8) continue;

    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const registration = parts[2] || 'Unknown';

    gliders.push({
      lat,
      lng,
      registration: registration.startsWith('_') ? '(anon)' : registration,
      deviceId:     parts[3]  || '',
      altitudeM:    parseInt(parts[4], 10)  || 0,
      altitudeFt:   Math.round((parseInt(parts[4], 10) || 0) * 3.281),
      timeUtc:      parts[5]  || '',
      speedKmh:     parseInt(parts[6], 10)  || 0,
      heading:      parseInt(parts[7], 10)  || 0,
      climbRate:    parseFloat(parts[8])    || 0,
      aircraftType: parseInt(parts[10], 10) || 0,
      receiver:     parts[11] || '',
      isAnonymous:  registration.startsWith('_'),
    });
  }

  return gliders;
}
