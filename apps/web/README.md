# Web storefront

## Dummy catalog mode

Use built-in demo products (laptops, air fryers, electric bikes, headphones, and more) for design work and page prototyping:

```bash
NEXT_PUBLIC_USE_DUMMY_CATALOG=true
```

When enabled, catalog, product, cart, checkout, and order pages work without the API.

## Dummy images

By default, demo products use Picsum placeholders. To use your own Cloudflare-hosted images, set:

```bash
NEXT_PUBLIC_DUMMY_IMAGE_URLS=https://imagedelivery.net/<hash>/product-01/public,https://imagedelivery.net/<hash>/product-02/public
```

Image URL order follows the dummy products order in `lib/dummyCatalog.ts`.
