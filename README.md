# Vlegel Technology Passport Maker

A tiny, conference-friendly Digital Product Passport playground. Visitors can craft a quick passport, preview it as a branded card (complete with QR code), and pin it to a local showcase wall that persists via `localStorage`.

## Features

- Guided 3-step layout: describe, preview, and pin to the showcase wall.
- Randomizer button pre-fills playful sample data for quick demos.
- QR codes powered by `QRCode.js`, encoding the underlying passport JSON.
- Responsive cards with CO2 and recyclability meters, ready for phones on the expo floor.
- Showcase wall supports view + delete actions and survives page reloads on the same device.

## Get Started Locally

```bash
cd vlegel-technology-passport-maker
# open the index.html file directly, or serve statically:
python -m http.server 4173
```

Open `http://localhost:4173` (or the file directly) and start creating passports.

## Deployment

Because it is 100% static, enable GitHub Pages on the repository (Deploy from branch -> `main` -> `/`). The resulting URL is what you will reference on your rollup banner's QR code.

## Customization Ideas

1. Swap `img/logo.svg` with your own logomark.
2. Update `SAMPLE_DATA` arrays inside `js/app.js` to match real showcase examples.
3. Add more form inputs (serials, warranty info, etc.) and surface them both in the preview and wall cards.
4. Hook up an optional "duplicate" action in the wall for faster iteration during live demos.
