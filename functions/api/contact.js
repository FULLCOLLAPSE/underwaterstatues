// Contact form endpoint. Hands the post to the us-contact Worker, which has
// the email binding (Pages Functions can't send email directly).
// Needs a Service binding named CONTACT → us-contact in the Pages project.
export async function onRequestPost({ request, env }) {
  if (!env.CONTACT) {
    return new Response(JSON.stringify({ ok: false, error: 'not configured' }), {
      status: 503, headers: { 'Content-Type': 'application/json' },
    });
  }
  // Only accept posts from our own pages.
  const origin = request.headers.get('Origin') ?? '';
  if (origin && !/^https:\/\/(www\.)?underwaterstatues\.com$|^https:\/\/([a-z0-9-]+\.)?underwaterstatues\.pages\.dev$|^http:\/\/localhost(:\d+)?$/.test(origin)) {
    return new Response(JSON.stringify({ ok: false }), { status: 403, headers: { 'Content-Type': 'application/json' } });
  }
  return env.CONTACT.fetch(new Request('https://us-contact/send', {
    method: 'POST',
    headers: { 'Content-Type': request.headers.get('Content-Type') ?? '' },
    body: request.body,
  }));
}
