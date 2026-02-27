# Bug reproduction: i18n fallback middleware intercepts 3xx redirects from page handlers

Minimal reproduction for an Astro SSR bug where the i18n fallback middleware
intercepts `302` responses returned by page handlers on non-default locale
routes, replacing them with a redirect to the **default-locale equivalent of
the current page** instead of honouring the handler's intended redirect target.

## Environment

```
astro:        ^5.18.0
@astrojs/node ^9.5.4
output:       'server'
```

## Steps to reproduce

```bash
npm install
npm run build
npm start        # listens on http://localhost:4321 by default
```

Then in another terminal:

```bash
# GET — works correctly (200)
curl -si http://localhost:4321/en/example | head -3

# POST — should redirect to /en/success; actually redirects to /example
curl -si -X POST http://localhost:4321/en/example | head -4
```

Or open `http://localhost:4321/en/example` in a browser and click **Submit**.

> `security.checkOrigin` is set to `false` in `astro.config.mjs` so that `curl`
> can POST without an `Origin` header. The bug is present regardless of that
> setting — you can remove it and submit the form from a browser instead.

## Expected behaviour

The server responds with `302 Location: /en/success`, and the browser lands on
`/en/success` showing "Success!".

## Actual behaviour

The server responds with `302 Location: /example` (the **German** equivalent of
the current page). The browser is redirected to the default-locale page instead
of the intended target.

A plain `GET` to `/en/example` correctly returns `200` — only requests where
the page handler itself returns a `3xx` response are affected.

## Why this happens (hypothesis)

The i18n fallback middleware checks whether the response status indicates a
missing resource, but it appears to treat **any** non-`200` response (or any
response other than the page's own rendered HTML) as a signal that the page
doesn't exist in the current locale and should fall back to the default locale.
It should only trigger on `404` (or `Not Found`) responses, leaving all other
status codes — including `3xx` redirects produced by the page handler —
untouched.

## i18n config used

```js
// astro.config.mjs
i18n: {
  locales: ['de', 'en'],
  defaultLocale: 'de',
  fallback: { en: 'de' },
},
```

## File structure

```
src/pages/
  index.astro          # de default locale landing page
  example.astro        # de equivalent required by the fallback mapping
  en/
    example.astro      # ← POST handler that calls Astro.redirect('/en/success')
    success.astro      # intended redirect target
```
