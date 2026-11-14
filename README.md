# Abdurrahman Housari — Engineering & Projects

A white-and-navy personal portfolio with 16 project case studies, dedicated browser experiences, project media, and QR links.

Public address: https://ahousari.github.io/

## Build and preview

Requires Python 3.10+, Pillow, and Node.js for the optional preview server.

```sh
python -m pip install -r requirements.txt
python scripts/build.py
node scripts/serve.mjs
```

Open http://127.0.0.1:4173/. The generated website is in `build/`. `site.json` supplies the canonical origin used by sharing images, metadata, the sitemap, and QR codes.

The builder uses Arial fonts from Windows when producing share cards. The current build environment is Windows. The website itself works as static HTML/CSS/JavaScript on other platforms.

## Editing

- `src/content.py`: project descriptions and experience from the October 2026 technical resume and reviewed project documentation.
- `src/style.css`: white/navy design and responsive layouts.
- `src/demos.js`: self-contained engineering/interaction examples.
- `src/rotation.js`: visitor-local music playground with IndexedDB storage, playback, playlists, weights, and WAV trimming.
- `public/assets/`: selected owner-supplied portraits, mace photographs, resume, and sample-application images.
- `public/play/lantern-vale/`: the original playable Lantern Vale opening demo, with its image exports compressed as WebP for the web.
- `scripts/build.py`: pages, media cards, original synthesized audio, sitemap, and QR images.

The full original desktop applications and their private installations are separate from this repository. Browser experiences explain their scope on the project pages. A QR code contains only a public experience URL.

## Checks

`scripts/check.mjs` exercises responsive routes, internal links, images, calculations, actual sample playback, visitor audio persistence, reading progress, and the individual interactive examples. It uses Playwright and Chrome. Checks and screenshots are written to the ignored `.qa/` directory.

## Publication

GitHub Pages serves the generated files at the repository root from `main`, with `.nojekyll`. The source directories remain available for maintenance. Rebuild locally and publish the resulting `build/` contents alongside the maintained source when updating.

## Credits

Project descriptions, portraits, and supplied mace images: Abdurrahman Housari. The alarm-clock project credits Omar Housari as a collaborator. Fabrication of the ceremonial mace involved collaboration with machinists.

QR generation uses Project Nayuki's QR Code generator library under its included MIT license (`scripts/vendor/qrcodegen.py`). The portfolio sample clips are deterministic synthesized audio generated specifically for this site. Original-project tools integrate third-party libraries/models as described in their individual project pages; this portfolio does not redistribute their model weights.
