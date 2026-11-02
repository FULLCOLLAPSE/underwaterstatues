// GitHub sign-in for the /admin editor (Sveltia CMS).
//
// Runs as a Cloudflare Pages Function on the site itself, so there is no
// separate Worker to deploy. Adapted from sveltia/sveltia-cms-auth (MIT),
// trimmed to GitHub only.
//
// Needs two environment variables in the Pages project settings:
//   GITHUB_CLIENT_ID      — from the GitHub OAuth app
//   GITHUB_CLIENT_SECRET  — from the GitHub OAuth app (set as a Secret)
//
// Flow: the editor opens /api/auth in a popup → we redirect to GitHub →
// GitHub sends the visitor back to /api/callback with a code → we swap the
// code for a token and hand it to the editor window with postMessage.

// Only these sites may receive a token.
const ALLOWED_HOSTS = [
  'underwaterstatues.com',
  'www.underwaterstatues.com',
  'underwaterstatues.pages.dev',
  'localhost',
];

// The repo is public, so public_repo is enough. Anything else asked for is
// narrowed to this, never widened.
const ALLOWED_SCOPES = ['public_repo', 'repo', 'user', 'read:user', 'user:email'];
const DEFAULT_SCOPE = 'public_repo,read:user';

const json = (v) => JSON.stringify(v ?? null).replaceAll('<', '\\u003c');

function popupPage({ token, error, errorCode }) {
  const state = error ? 'error' : 'success';
  const content = error ? { provider: 'github', error, errorCode } : { provider: 'github', token };
  const message = `authorization:github:${state}:${JSON.stringify(content)}`;
  const html = `<!doctype html><html><body><script>
(() => {
  const allowed = ${json(ALLOWED_HOSTS)};
  const hasToken = ${json(!!token)};
  const message = ${json(message)};
  window.addEventListener('message', ({ data, origin }) => {
    if (data !== 'authorizing:github') return;
    let host = '';
    try { host = new URL(origin).hostname; } catch {}
    if (hasToken && !allowed.includes(host)) return;
    window.opener && window.opener.postMessage(message, origin);
  });
  window.opener && window.opener.postMessage('authorizing:github', '*');
})();
</script></body></html>`;
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': 'us-oauth-state=deleted; HttpOnly; Max-Age=0; Path=/api; SameSite=Lax; Secure',
    },
  });
}

function scopeFor(requested) {
  const asked = (requested ?? '').split(/[\s,]+/).filter(Boolean);
  if (asked.length && asked.every((s) => ALLOWED_SCOPES.includes(s))) return asked.join(',');
  return DEFAULT_SCOPE;
}

export function handleAuth(request, env) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('provider') && searchParams.get('provider') !== 'github') {
    return popupPage({ error: 'Only GitHub sign-in is supported.', errorCode: 'UNSUPPORTED_BACKEND' });
  }
  const site = searchParams.get('site_id') ?? '';
  if (!ALLOWED_HOSTS.includes(site)) {
    return popupPage({ error: 'This site is not allowed to sign in here.', errorCode: 'UNSUPPORTED_DOMAIN' });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return popupPage({ error: 'GitHub sign-in is not configured yet.', errorCode: 'MISCONFIGURED_CLIENT' });
  }
  const state = crypto.randomUUID().replaceAll('-', '');
  const params = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    scope: scopeFor(searchParams.get('scope')),
    state,
  });
  return new Response('', {
    status: 302,
    headers: {
      Location: `https://github.com/login/oauth/authorize?${params}`,
      'Cache-Control': 'no-store',
      'Set-Cookie': `us-oauth-state=${state}; HttpOnly; Path=/api; Max-Age=600; SameSite=Lax; Secure`,
    },
  });
}

export async function handleCallback(request, env) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookie = request.headers.get('Cookie')?.match(/\bus-oauth-state=([0-9a-f]{32})\b/)?.[1];

  if (!code || !state) {
    return popupPage({ error: 'GitHub did not return a sign-in code. Try again.', errorCode: 'AUTH_CODE_REQUEST_FAILED' });
  }
  if (!cookie || cookie !== state) {
    return popupPage({ error: 'Sign-in check failed. Close this window and try again.', errorCode: 'CSRF_DETECTED' });
  }
  if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
    return popupPage({ error: 'GitHub sign-in is not configured yet.', errorCode: 'MISCONFIGURED_CLIENT' });
  }

  let data;
  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET }),
    });
    data = await res.json();
  } catch {
    return popupPage({ error: 'Could not reach GitHub. Try again in a minute.', errorCode: 'TOKEN_REQUEST_FAILED' });
  }
  if (!data.access_token) {
    return popupPage({ error: data.error_description || data.error || 'GitHub refused the sign-in.', errorCode: 'TOKEN_REQUEST_FAILED' });
  }
  return popupPage({ token: data.access_token });
}
