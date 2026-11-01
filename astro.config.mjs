import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://underwaterstatues.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },   // /journal/x.html → served at /journal/x with no redirect
});
