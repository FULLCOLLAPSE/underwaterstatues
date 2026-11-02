// Config for the /admin editor (Sveltia CMS), generated at build time so the
// Product dropdown lists whatever is live in Big Cartel on the last build.
// Output is JSON, which is valid YAML.
import type { APIRoute } from 'astro';
import { getProducts } from '../../lib/products';

export const GET: APIRoute = async () => {
  const products = await getProducts();
  const productOptions = products.map((p) => ({ label: p.name, value: p.permalink }));

  const config = {
    backend: {
      name: 'github',
      repo: 'FULLCOLLAPSE/underwaterstatues',
      branch: 'main',
      base_url: 'https://www.underwaterstatues.com/api',
      auth_endpoint: 'auth',
      auth_scope: 'public_repo',
      commit_messages: {
        create: 'Add {{collection}} “{{slug}}”',
        update: 'Update {{collection}} “{{slug}}”',
        delete: 'Delete {{collection}} “{{slug}}”',
        uploadMedia: 'Upload “{{path}}”',
        deleteMedia: 'Delete “{{path}}”',
      },
    },
    site_url: 'https://www.underwaterstatues.com',
    display_url: 'https://www.underwaterstatues.com',
    logo: { src: '/admin/logo.svg', show_in_header: true },
    media_folder: 'public/images/journal',
    public_folder: '/images/journal',
    // Photos dropped in are resized to 1600px wide and converted to WebP before upload.
    media_libraries: {
      default: {
        config: {
          max_file_size: 26214400,
          transformations: { raster_image: { format: 'webp', quality: 82, width: 1600, height: 4000 } },
        },
      },
    },
    collections: [
      {
        name: 'journal',
        label: 'Journal',
        label_singular: 'Entry',
        folder: 'content/journal',
        extension: 'md',
        format: 'frontmatter',
        create: true,
        slug: '{{slug}}',
        preview_path: 'journal/{{slug}}',
        summary: '{{title}} — {{date}}{{draft | ternary(" (draft)", "")}}',
        sortable_fields: { fields: ['date', 'title'], default: { field: 'date', direction: 'descending' } },
        fields: [
          { name: 'title', label: 'Title', widget: 'string' },
          {
            name: 'date', label: 'Date', widget: 'datetime',
            format: 'YYYY-MM-DD', time_format: false, default: '{{now}}',
          },
          {
            name: 'product', label: 'Product', widget: 'select', required: false,
            options: productOptions,
            hint: 'Which product this entry is about. Leave empty for a general entry. The list updates each time the site rebuilds.',
          },
          {
            name: 'featured', label: 'Feature on homepage', widget: 'boolean', default: false, required: false,
            hint: 'The newest ticked entry that has a product fills the big homepage section.',
          },
          {
            name: 'cover', label: 'Cover photo', widget: 'image', required: false,
            hint: 'Square, 1600 × 1600. Shown at the top of the entry.',
          },
          {
            name: 'draft', label: 'Draft', widget: 'boolean', default: false, required: false,
            hint: 'Drafts are saved but not shown on the site.',
          },
          {
            name: 'body', label: 'Text', widget: 'markdown',
            hint: 'The first two paragraphs appear on the homepage when this entry is featured. Drag photos straight in.',
          },
        ],
      },
      {
        name: 'faq',
        label: 'FAQ',
        label_singular: 'Question',
        folder: 'content/faq',
        extension: 'md',
        format: 'frontmatter',
        create: true,
        slug: '{{slug}}',
        summary: '{{order}}. {{question}}',
        identifier_field: 'question',
        sortable_fields: { fields: ['order', 'question'], default: { field: 'order', direction: 'ascending' } },
        fields: [
          { name: 'question', label: 'Question', widget: 'string' },
          { name: 'order', label: 'Order', widget: 'number', value_type: 'int', default: 10, hint: 'Lower numbers appear first.' },
          { name: 'body', label: 'Answer', widget: 'markdown' },
        ],
      },
      {
        name: 'pages',
        label: 'Pages',
        files: [
          {
            name: 'about',
            label: 'About',
            file: 'content/about.md',
            preview_path: 'about',
            fields: [
              { name: 'title', label: 'Heading', widget: 'string' },
              { name: 'image', label: 'Photo', widget: 'image', required: false, media_folder: '/public/images/about', public_folder: '/images/about' },
              { name: 'imageAlt', label: 'Photo description', widget: 'string', required: false, hint: 'For screen readers. One sentence.' },
              { name: 'body', label: 'Text', widget: 'markdown' },
            ],
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'application/yaml; charset=utf-8' },
  });
};
