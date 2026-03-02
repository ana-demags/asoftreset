# Custom fonts

Place Gambarino here so the app can load it:

- **File:** `Gambarino-Regular.woff2`
- **Path:** `public/fonts/Gambarino-Regular.woff2`

To add multiple weights (e.g. regular + medium), use an array in `src`:

```ts
src: [
  { path: './public/fonts/Gambarino-Regular.woff2', weight: '400' },
  { path: './public/fonts/Gambarino-Medium.woff2', weight: '500' },
],
```
