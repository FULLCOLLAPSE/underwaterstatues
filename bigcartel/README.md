# Big Cartel theme

Templates for store.underwaterstatues.com, matching the main site (design A5).
These are pasted into Big Cartel → Shop designer → Code → Advanced template code,
one file per page. Big Cartel doesn't read this folder; it's the source of truth.

- layout.html — header, wordmark, nav (Store/Cart local, everything else → main site), footer
- home.html, products.html — product grid
- product.html — photos left, details + add to cart right; "Read about the design"
  appears when https://www.underwaterstatues.com/journal/products.json lists the product
- cart.html — line items, quantity, subtotal, checkout
- contact.html — redirects to the main site's contact page
- maintenance.html — shown while the store is closed
- theme.css — shared tokens + grid from src/styles/statues.css, plus store pieces
