# Font files

The app's two fonts, committed so that `next build` downloads nothing
([ADR-0051](../../../docs/explanation/decisions/adr-0051-fonts-are-built-from-committed-files.md), #201).
`src/app/fonts.ts` loads them with `next/font/local`. The `_` prefix keeps this folder out of
routing.

| File                                        | Font              | Coverage     | `wght`  | Licence                                                       |
| ------------------------------------------- | ----------------- | ------------ | ------- | ------------------------------------------------------------- |
| `quicksand-wght-normal.woff2`               | Quicksand         | every glyph  | 300–700 | OFL 1.1, Reserved Font Name "Quicksand" (`OFL-quicksand.txt`) |
| `plus-jakarta-sans-latin-wght-normal.woff2` | Plus Jakarta Sans | Latin subset | 200–800 | OFL 1.1, no Reserved Font Name (`OFL-plus-jakarta-sans.txt`)  |

Each licence file is the one published beside the font. OFL 1.1 requires it to travel with the
font, so do not delete it. The served files carry it too, in their name tables: Quicksand's holds
the licence text (name ID 13), and Plus Jakarta Sans's the licence URL (name ID 14), which OFL FAQ
1.10 accepts.

## Where each file comes from

**Quicksand** is the unmodified upstream font, converted to WOFF2 and nothing else.

- Source: `ofl/quicksand/Quicksand[wght].ttf` in [google/fonts](https://github.com/google/fonts)
  at `c30b221beb0c1da59d563feb91ec8656a1fa972a`, sha256
  `39c9b64223561f56aaff6062a6f04063c4fc86809ad6768722c06614d977e1cc`. `OFL-quicksand.txt` is
  `ofl/quicksand/OFL.txt` at the same commit.
- Converted with fonttools 4.60.2 (`TTFont.flavor = "woff2"`). Checked after conversion: every table
  and all 812 glyphs match the source. The one exception is `DSIG`, an 8-byte stub that holds no
  signature; the WOFF2 encoder always drops it. The file has no WOFF metadata block.
- **Do not subset it.** "Quicksand" is a Reserved Font Name. The OFL FAQ (2.6) treats a subset as a
  Modified Version, and a Modified Version may not carry that name. A format change that only
  compresses the font is not a Modified Version (FAQ 2.2.1), which is why this file can.

**Plus Jakarta Sans** is Fontsource's Latin subset.

- Source: `files/plus-jakarta-sans-latin-wght-normal.woff2` in
  `@fontsource-variable/plus-jakarta-sans@5.3.0`. `OFL-plus-jakarta-sans.txt` is that package's
  `LICENSE`. The package is not a dependency of this repository; the file was copied out of it.
- Characters outside Latin render in the fallback face `next/font` generates.

## sha256

```text
953ecbd16eff4e219e105ee8ec2002e820683cc923cc7d702bb0119f023955e8  quicksand-wght-normal.woff2
153fc85b70298beeb1d61a5f723331649e7f23bb77302a66e61cb3e2fbdb5e79  plus-jakarta-sans-latin-wght-normal.woff2
```

## Refreshing a font

1. Fetch the new source: `npm pack @fontsource-variable/plus-jakarta-sans@<version>`, or the
   google/fonts file at a named commit. Do this in a scratch directory, not here.
2. For Quicksand, convert the whole font to WOFF2 with fonttools and compare it with the source as
   described above. Never take a subset of it, Fontsource's included.
3. Replace the file and its licence, then update this README: source, version or commit, sha256.
4. Build and look at both fonts on `/login`. If a file name changes, update `src/app/fonts.ts`.
