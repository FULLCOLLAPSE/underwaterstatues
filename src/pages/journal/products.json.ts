// { "<big-cartel-permalink>": "https://www.underwaterstatues.com/journal/<slug>" }
// Read by the Big Cartel product page to show "Read about the design".
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async () => {
  const entries = (await getCollection('journal', (e) => !e.data.draft && e.data.product))
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
  const map: Record<string, string> = {};
  for (const e of entries) {
    const key = e.data.product!;
    if (!map[key]) map[key] = `https://www.underwaterstatues.com/journal/${e.id}`; // newest entry wins
  }
  return new Response(JSON.stringify(map), { headers: { 'Content-Type': 'application/json' } });
};
