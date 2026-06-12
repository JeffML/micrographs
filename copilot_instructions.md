# Wallgallery — Copilot Session Context

Read this file at the start of a new session to restore context.

---

## What This Project Is

A single-page interactive photo wall (`index.html`) deployed on Netlify. Visitors see a wall of framed micrograph photographs. Each photo has an invisible hotspot overlay — clicking opens a popup with structured metadata (subject, magnification, lighting, tags, notes, price). An editor mode allows drawing, moving, resizing, and editing hotspots, protected by a server-side password.

No build step. No framework. Plain HTML/CSS/JS + Netlify Functions + Netlify Blobs.

Commerce note: `microAlbum` is the source of truth for saleable inventory. `wallgallery` is the first customer-facing buy-flow host. `gallery-items.json` and `products.json` in this repo are channel projections — derived from microAlbum metadata until the P2 promotion pipeline is built.

---

## Commerce Data (P1)

Channel projection files live at the repo root:

| File                 | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `gallery-items.json` | Public display metadata (slug, title, image, status, forSale) |
| `products.json`      | Saleable offer records (variants, priceMinor, checkoutUrl)    |

### Required fields — `products.json`

Each product must have:
- `slug` (string, non-empty) — must match hotspot slug or subject
- `variants` (array, ≥1)

Each variant must have:
- `sku` (string, non-empty)
- `priceMinor` (integer ≥ 0, cents)
- `active` (boolean) — only active variants show Buy button as enabled
- `checkoutUrl` (string, must start with `https://`) — required for Buy button to be enabled

Invalid products/variants are silently filtered at load time with `console.warn`. Missing or malformed records never crash the page.

### Buy flow (viewer popup)

1. Click hotspot → popup opens
2. Hotspot is matched to product via slug normalization (see `scripts/commerce-mapping.mjs`)
3. If matched: variant selector shown, defaults to first active variant
4. Selecting a variant updates the displayed price
5. Buy button: enabled (`<a href=checkoutUrl target=_blank rel="noopener noreferrer">`) when variant is active + has checkoutUrl; disabled otherwise
6. Buy → opens Square payment link in new tab

### Adding a new product

1. Add entry to `gallery-items.json` (display metadata)
2. Add entry to `products.json` (offer/pricing with Square link)
3. Ensure hotspot `slug`, `subject`, or `tooltip` matches the product slug (after lowercase/dash normalization)
4. Run `npm run test:step1` and `npm run test:step2` to validate

### Test scripts

| Script             | What it checks                                      |
| ------------------ | --------------------------------------------------- |
| `npm run test:step1` | gallery-items.json + products.json structure/fields |
| `npm run test:step2` | hotspot-to-product mapping logic                    |
| `npm run test:step3` | variant selector defaults and HTML structure         |
| `npm run test:step4` | buy button state (enabled/disabled/HTTPS)           |
| `npm run test:step5` | product/variant validation + graceful fallback      |

---

## E2E Manual Preview Checklist (Step 6)

Run against `netlify dev` (localhost:8888) or a draft deploy.

- [ ] Open `http://localhost:8888` — wall image loads, no console errors
- [ ] Click the Mountain Ash hotspot — popup opens
- [ ] Popup shows: subject, variant selector with "8×10 signed print — $250.00", price "$250.00"
- [ ] Variant option is highlighted (selected state)
- [ ] "Buy Now" button is visible and yellow
- [ ] Click "Buy Now" — Square payment page opens in new tab at `https://square.link/u/dZhGa2H4`
- [ ] Close popup (× or click outside) — popup closes cleanly
- [ ] No JS errors in browser console throughout

---

## Repo & Deployment

- **Local folder**: `/home/jlowery2663/wallgallery`
- **GitHub repo**: `https://github.com/JeffML/micrographs` (local folder was renamed to `wallgallery` but GitHub repo name was NOT changed — still `micrographs`)
- **Netlify site**: `micrographs` — site ID `4e474d73-5848-4f08-b9ce-b06faf733b3a`, URL `https://micrographs.netlify.app`
- **Netlify link**: run `netlify link --id 4e474d73-5848-4f08-b9ce-b06faf733b3a` if `.netlify/state.json` is missing

Fix broken git remote with:

```bash
git remote set-url origin https://github.com/JeffML/micrographs
```

---

## Dev Workflow

| Task              | Command                                 |
| ----------------- | --------------------------------------- |
| Local dev server  | `netlify dev` → `http://localhost:8888` |
| Draft deploy      | `netlify deploy`                        |
| Production deploy | `netlify deploy --prod`                 |

- **Local dev** is safe for editor testing — blobs are isolated locally
- **Draft deploys share production blobs** — use viewer mode only on drafts; do not use the editor
- Local dev falls back to `hotspots.json` and `frames.jpg` when local blobs are empty
- `npm install` must be run once to install `@netlify/blobs`

---

## Password

- Entered via **Shift+Alt+E** (desktop) or 5 taps (mobile)
- Validated against the server immediately on entry (POST `{ password, validate: true }` to `/api/hotspots`)
- Stored in memory only (`let editorPassword`) — never persisted client-side
- Server-side: SHA-256 hash compared against `EDITOR_PASSWORD_HASH` env var in Netlify

To reset password:

```bash
echo -n "newpassword" | sha256sum
```

Then update `EDITOR_PASSWORD_HASH` in Netlify → Site configuration → Environment variables → redeploy.

---

## Hotspot Data Structure

Stored in Netlify Blobs (`hotspots` store, key `data`). Falls back to `/hotspots.json` when empty.

```json
{
  "x": 5.2,
  "y": 8.1,
  "w": 18.4,
  "h": 24.6,
  "tooltip": "Hover label",
  "subject": "Full subject description",
  "magnification": "40x",
  "lighting": ["darkfield", "brightfield"],
  "tags": ["flower"],
  "notes": "Free-form notes",
  "price": "$250",
  "link": "statement.html"
}
```

`x`, `y`, `w`, `h` are percentages of image dimensions.

---

## Netlify Functions

| Function       | Path            | Purpose                                                                                          |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------ |
| `hotspots.mjs` | `/api/hotspots` | GET: return hotspots (fallback to `/hotspots.json`); POST: validate password and optionally save |
| `image.mjs`    | `/api/image`    | GET: return uploaded image (fallback to `/frames.jpg`); POST: upload new image                   |

Both verify password via SHA-256 hash. `hotspots.mjs` POST accepts `{ password, validate: true }` to check password without saving.

---

## Viewer Mode (public)

- Hotspot areas are invisible but `cursor: pointer`
- Hover shows a small tooltip (`.tip`) with the `tooltip` field
- Click opens a dark overlay popup showing: subject, magnification, lighting, tags, notes, price
- "No details yet." shown if all fields are empty
- Close via ×, click outside overlay, or Escape

## Editor Mode

- Enter: Shift+Alt+E (desktop) or 5 taps (mobile) → password prompt → server validation
- Exit: Escape / Exit Editor button / password rejected on save
- Hotspots shown with gold border + move cursor
- **Draw**: drag on empty area → edit modal opens automatically
- **Edit**: click hotspot (no drag) → edit modal opens
- **Move**: drag hotspot
- **Resize**: drag yellow bottom-right handle
- **Delete**: red × button (top-right)
- **Save**: toolbar Save button — POSTs to `/api/hotspots` with password + full hotspot array
- Escape priority: edit modal > viewer popup > exit editor

---

## Key Files

| File                             | Notes                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------- |
| `index.html`                     | All UI, CSS, and JS in one file                                                   |
| `hotspots.json`                  | Fallback data for local dev — keep updated with representative new-format entries |
| `frames.jpg`                     | Fallback image for local dev                                                      |
| `netlify/functions/hotspots.mjs` | Hotspot API                                                                       |
| `netlify/functions/image.mjs`    | Image API                                                                         |
| `netlify.toml`                   | `publish = "."` — no build step                                                   |
| `package.json`                   | Only dependency: `@netlify/blobs`                                                 |

---

## Known Issues / Open Items

- GitHub repo name (`micrographs`) doesn't match local folder name (`wallgallery`) — can rename on GitHub Settings if desired, then update remote URL and Netlify connected repo
- Hover tooltip (`.tip`) still shows in viewer mode alongside click popup — consider removing or keeping as preview
