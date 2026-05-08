# Micrographs Photo Wall

An interactive photo wall where each framed photograph has a clickable popup with structured metadata.

## Files

| File            | Purpose                                       |
| --------------- | --------------------------------------------- |
| `index.html`    | The viewer/editor page                        |
| `hotspots.json` | Fallback hotspot data (used when blobs empty) |
| `frames.jpg`    | Fallback wall photo (used when blobs empty)   |

---

## Workflow

| Task                  | How                                             |
| --------------------- | ----------------------------------------------- |
| **Local dev**         | `netlify dev` → `http://localhost:8888`         |
| **Test UI changes**   | Use local dev (editor-safe, isolated blobs)     |
| **Draft deploy**      | `netlify deploy` — viewer mode only, no editing |
| **Production deploy** | `netlify deploy --prod` or push to GitHub       |
| **Live editing**      | Use the production site directly                |

> ⚠ Draft deploys share production blobs — don't use editor mode on a draft.

---

## Editor Access

| Platform | Trigger                     |
| -------- | --------------------------- |
| Desktop  | **Shift+Alt+E**             |
| Mobile   | 5 taps anywhere on the page |

Password is validated against the server on entry. To reset the password:

1. `echo -n "newpassword" | sha256sum`
2. Update `EDITOR_PASSWORD_HASH` in Netlify → Site configuration → Environment variables
3. Redeploy

---

## Adding / Editing Hotspots

1. Enter editor mode (see above)
2. **Draw** a hotspot: drag a rectangle over a photo frame → edit modal opens automatically
3. **Edit** a hotspot: click it (without dragging) → edit modal opens
4. **Move** a hotspot: drag it
5. **Resize** a hotspot: drag the yellow corner handle
6. **Delete** a hotspot: click the red **×** button
7. Click **Save** in the toolbar when done, or **Exit Editor** / **Escape** to discard

---

## Hotspot Edit Fields

| Field         | Description                                    |
| ------------- | ---------------------------------------------- |
| Hover label   | Short text shown on mouse hover                |
| Subject       | Full description of the subject                |
| Magnification | e.g. `40x`, `100x`                             |
| Lighting      | Comma-separated: e.g. `darkfield, brightfield` |
| Tags          | Comma-separated keywords                       |
| Notes         | Free-form notes                                |
| Price         | e.g. `$250` (shown highlighted in popup)       |

---

## Hotspot Data Format

`hotspots.json` is the fallback for local dev when blobs are empty. Format:

```json
[
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
    "notes": "Any notes",
    "price": "$250"
  }
]
```

`x`, `y`, `w`, `h` are percentages of image dimensions — hotspots scale at any screen size.

---

## Updating the Wall Photo

1. Enter editor mode → click **Upload Photo** in the toolbar
2. Realign any misaligned hotspots (drag/resize or delete and redraw)
3. Click **Save**
