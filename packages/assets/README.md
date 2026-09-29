# @snt/assets

Shared static files. Deliberately plain: binary files plus a small TypeScript
manifest, no build step, no framework code.

## Why it is a package

So the web app and a future Expo app reference the same file for the same thing,
rather than each keeping its own copy that drifts.

## Layout

```
brand/      wordmark, app mark — SVG
images/     photographs, illustrations, empty-state art
fonts/      self-hosted font files — Poppins, woff2
```

## Consuming from the web app

`@snt/assets` is listed in the web app's `transpilePackages`, so files can be
imported directly:

- **SVG and images** — import the file and pass the result to `next/image`, or
  reference it through the manifest in `src/index.ts`
- **Anything in `public/`** — app-specific assets that are not shared belong in
  `apps/web/public`, not here

## Consuming from a native app

The same files work. Import them through Expo's asset system. The manifest is
plain data, so it resolves identically on both platforms.

## What does not belong here

- **Icons.** They are inline SVG React components in `@snt/ui`, because they
  take their colour from `currentColor` and need to be styled by CSS.
- **App-specific one-offs.** Put those in the app's own `public/`.

## Fonts

`fonts/poppins/` holds Poppins at 400, 500, 600, 700 and 800, normal style
only — the five weights the type tokens in `@snt/ui` name, and no more. Each file is
subset to latin + latin-ext and weighs about 11 kB.

They are committed rather than linked from Google Fonts for two reasons: a
third-party request is one more thing that can be slow or blocked on a
Zimbabwean mobile connection, and a font that arrives late reflows the page.
Self-hosted and preloaded, the file is in flight with the document.

The web app loads them with `next/font/local` in `apps/web/src/app/layout.tsx`,
which fingerprints them, emits the `@font-face` rules and derives a
metric-matched fallback. A native app can load the same files through Expo.

Licensed under the SIL Open Font License — see `fonts/poppins/OFL.txt`.
Regenerate by subsetting the upstream OFL release; do not hand-edit the woff2.

## Current contents

The logo (`brand/logo-white.svg`, carried over from the v1 app's header), the
old text-only wordmark, and the Poppins weights. Every image in the design is a
grey placeholder box, so there is nothing else to store yet — see
`ImagePlaceholder` in `@snt/ui`. Real photography replaces those placeholders
listing by listing, and none of it is committed here; listing photos live in
object storage.
