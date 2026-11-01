// Products come from Big Cartel's public feed at build time.
// If the feed is unreachable (store in maintenance, trial ended, network), the
// placeholders below keep the site building — nothing on the site hard-depends on it.

export interface Product {
  permalink: string;   // the join key shared with journal entries
  name: string;
  price: number;
  priceLabel: string;
  image: string;
  url: string;
  soldOut: boolean;
}

export const STORE_SUBDOMAIN = 'justin-6900';
export const STORE_URL = 'https://store.underwaterstatues.com';

const PLACEHOLDERS: Product[] = [
  { permalink: 'knurled-thumbscrew-38', name: 'Knurled Thumbscrew 3/8', price: 36, image: '/images/products/knurled-thumbscrew-38.png' },
  { permalink: 'hollyland-adapter',     name: 'Hollyland Adapter',      price: 28, image: '/images/products/hollyland-adapter.png' },
  { permalink: 'cable-lock-b',          name: 'Cable Lock B',           price: 42, image: '/images/products/cable-lock-b.png' },
  { permalink: 'laptop-bracket',        name: 'Laptop Bracket',         price: 19, image: '/images/products/laptop-bracket.png' },
].map(finish);

function finish(p: { permalink: string; name: string; price: number; image: string; soldOut?: boolean }): Product {
  return {
    ...p,
    soldOut: p.soldOut ?? false,
    priceLabel: p.soldOut ? 'Sold out' : `$${Math.round(p.price)}`,
    url: `${STORE_URL}/product/${p.permalink}`,
  };
}

let cache: Product[] | null = null;

export async function getProducts(): Promise<Product[]> {
  if (cache) return cache;
  try {
    const res = await fetch(`https://api.bigcartel.com/${STORE_SUBDOMAIN}/products.json`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`feed ${res.status}`);
    const raw = (await res.json()) as any[];
    const live = raw
      .filter((p) => p.status === 'active' || p.status === 'sold-out')
      .map((p) =>
        finish({
          permalink: p.permalink,
          name: p.name,
          price: Number(p.price ?? p.default_price ?? 0),
          image: p.images?.[0]?.url ?? '',
          soldOut: p.status === 'sold-out' || (p.options?.length > 0 && p.options.every((o: any) => o.sold_out)),
        }),
      )
      .filter((p) => p.image);
    if (live.length === 0) throw new Error('feed empty');
    cache = live;
    console.log(`[products] ${live.length} from Big Cartel`);
  } catch (e) {
    console.warn(`[products] using placeholders — ${(e as Error).message}`);
    cache = PLACEHOLDERS;
  }
  return cache;
}

export async function getProduct(permalink: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.permalink === permalink);
}
