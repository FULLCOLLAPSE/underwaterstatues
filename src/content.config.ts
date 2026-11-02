import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Journal entries: one markdown file each in content/journal/.
// The file name is the URL slug. Pick the product's Big Cartel permalink as
// the slug when the entry is about one product, so the two link both ways.
const journal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/journal' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    product: z.string().optional(),   // Big Cartel permalink
    featured: z.boolean().default(false),
    cover: z.string().optional(),     // /images/journal/… (square, 1600px)
    draft: z.boolean().default(false),
  }),
});

// FAQ: one file per question, ordered by file name (01-shipping.md, 02-returns.md…).
const faq = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/faq' }),
  schema: z.object({
    question: z.string(),
    order: z.number().default(10),
  }),
});

// Single pages whose text lives in markdown: content/about.md.
const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content' }),
  schema: z.object({ title: z.string(), image: z.string().optional(), imageAlt: z.string().optional() }),
});

export const collections = { journal, faq, pages };
