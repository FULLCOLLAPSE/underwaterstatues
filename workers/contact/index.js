// Turns a contact-form submission into an email in Justin's inbox.
// Called only by the site's /api/contact Pages Function (service binding).
import { EmailMessage } from 'cloudflare:email';

const TO = 'justin@justindennisphoto.com';
const FROM = 'website@underwaterstatues.com';
const LIMITS = { name: 120, email: 200, message: 5000 };

const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Strip anything that could break out of a header line.
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').trim();

function encodeHeader(s) {
  // RFC 2047 for non-ASCII names/subjects.
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${btoa(String.fromCharCode(...new TextEncoder().encode(s)))}?=`;
}

function base64Body(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/.{76}/g, '$&\r\n');
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return json(405, { ok: false });

    let form;
    try { form = await request.formData(); } catch { return json(400, { ok: false, error: 'bad form' }); }

    // Honeypot: real people never fill this hidden field.
    if (oneLine(form.get('website'))) return json(200, { ok: true });

    const name = oneLine(form.get('name')).slice(0, LIMITS.name);
    const email = oneLine(form.get('email')).slice(0, LIMITS.email);
    const message = String(form.get('message') ?? '').trim().slice(0, LIMITS.message);

    if (!name || !message || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email)) {
      return json(400, { ok: false, error: 'missing fields' });
    }

    const subject = `Website message from ${name}`;
    const body = `${message}\n\n—\nFrom: ${name} <${email}>\nSent from the contact form on underwaterstatues.com\n`;
    const id = `<${crypto.randomUUID()}@underwaterstatues.com>`;

    const raw = [
      `From: ${encodeHeader('Underwater Statues website')} <${FROM}>`,
      `To: <${TO}>`,
      `Reply-To: ${encodeHeader(name)} <${email}>`,
      `Subject: ${encodeHeader(subject)}`,
      `Message-ID: ${id}`,
      `Date: ${new Date().toUTCString()}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      base64Body(body),
    ].join('\r\n');

    try {
      await env.MAILER.send(new EmailMessage(FROM, TO, raw));
    } catch (e) {
      console.error('send failed', e?.message);
      return json(502, { ok: false, error: 'send failed' });
    }
    return json(200, { ok: true });
  },
};
