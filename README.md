# Underwater Statues

Static site for underwaterstatues.com, built with Astro and deployed by Cloudflare Pages on every push to `main`.
The store lives on Big Cartel at store.underwaterstatues.com; products on the homepage come from its public feed at build time.

- `content/journal/*.md` — journal entries (file name = URL slug = Big Cartel permalink when about a product)
- `content/faq/*.md` — contact-page FAQ, ordered by file name
- `public/images/` — journal photos and placeholder product renders
- `src/` — the site

```
npm install
npm run dev
```
