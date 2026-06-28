# Wallgallery — Copilot Session Context

Read this file at the start of a new session to restore context.

---

## What This Project Is

A single-page interactive photo wall (`index.html`) deployed on Netlify. Visitors see a wall of framed micrograph photographs. Each photo has an invisible hotspot overlay — clicking opens a popup with structured metadata (subject, magnification, lighting, tags, notes, price). An editor mode allows drawing, moving, resizing, and editing hotspots, protected by a server-side password.

No build step. No framework. Plain HTML/CSS/JS + Netlify Functions + Netlify Blobs.

Commerce note: `microAlbum` is the source of truth for saleable inventory. `wallgallery` is the first customer-facing buy-flow host. `gallery-items.json` and `products.json` were used in P1 (stepping stone only) and will be retired once P3 is live. The **real pricing source is the `price` field in hotspot metadata** — the gallery is already live with prices.

---

## Commerce State (P3 complete — June 2026)

**P1 (manual Square links):** Complete. Proved UI pattern. Retired.
**P2 (promotion pipeline):** Deferred. Not needed before live selling.
**P3 (Square Checkout API):** **Complete and live in production.**
**P4 (order signal + fulfillment queue):** Next up.

### Current buy flow

1. Buyer clicks any hotspot with a `price` field → popup opens
2. "Buy Now" button POSTs `{ subject, priceMinor, currency }` to `/api/checkout`
3. Netlify Function `checkout.mjs` calls Square Checkout API → returns `checkoutUrl`
4. Browser opens Square-hosted payment page in new tab
5. Square emails buyer a receipt

### Netlify Function: `/api/checkout`

File: `netlify/functions/checkout.mjs`

Request: `POST { subject: string, priceMinor: integer, currency?: string }`  
Response: `{ checkoutUrl: string }` or `{ error: string }`

Env vars (production values in Netlify dashboard; local `.env` has sandbox values):

| Variable | Local (`.env`) | Production (Netlify dashboard) |
|---|---|---|
| `SQUARE_ACCESS_TOKEN` | sandbox token | production token |
| `SQUARE_LOCATION_ID` | `LRGPDNKDRNF8S` | production location ID |
| `SQUARE_ENVIRONMENT` | `sandbox` | `production` |

**Local `.env` is gitignored — never committed.**

### Test scripts

| Script | What it checks |
|---|---|
| `npm run test:step1` | gallery-items.json + products.json structure |
| `npm run test:step2` | hotspot-to-product mapping |
| `npm run test:step3` | variant selector defaults |
| `npm run test:step4` | buy button state logic |
| `npm run test:step5` | product/variant validation + fallback |
| `npm run test:p3-checkout` | live Square sandbox API call (sandbox only — refuses to run against production) |

### Branch state

`main` is the only branch. All P1/P3 work is merged. No active feature branches.

### What's next (P4)

- Select ingestion mode for Square order signal (webhook vs manual import)
- Persist canonical `OrderRecord` with fulfillment state
- Add minimal fulfillment queue view
- Define and test status transitions from paid → fulfilled

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
