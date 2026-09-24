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
fonts/      self-hosted font files, if we ever stop using Google Fonts
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

## Current contents

Only the brand wordmark. Every image in the wireframes is a grey placeholder
box, so there is nothing else to store yet — see `ImagePlaceholder` in
`@snt/ui`. Real photography replaces those placeholders listing by listing,
and none of it is committed here; listing photos live in object storage.
