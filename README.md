# Micrographs Photo Wall

An interactive photo wall where each framed photograph has a hover tooltip.

## Files

| File            | Purpose                            |
| --------------- | ---------------------------------- |
| `index.html`    | The viewer/editor page             |
| `hotspots.json` | Hotspot positions and tooltip text |
| `frames.jpg`    | The wall photo                     |

---

## First-Time Setup

1. Add your wall photo to this folder as `frames.jpg`
2. Deploy the folder to Netlify
3. Open the live site
4. Follow **Adding Hotspots** below
5. Follow **Saving Hotspots** below

---

## Adding / Editing Hotspots

1. Open the site in a browser
2. Press **Shift+Alt+E** to open the editor password prompt, then enter the password
3. **Draw** a hotspot: click and drag a rectangle over a photo frame → enter tooltip text when prompted
4. **Move** a hotspot: drag it to a new position
5. **Resize** a hotspot: drag the yellow corner handle
6. **Edit tooltip text**: click the hotspot (without dragging) or right-click it
7. **Delete** a hotspot: click the red **×** button in its corner
8. Press **Escape** or click **Exit Editor** when done

---

## Saving Hotspots

Click **Save** in the editor toolbar. The function verifies your password server-side and saves directly to Netlify Blobs — no git push needed.

---

## Updating the Photo (frames.jpg)

Use this procedure when the photo changes and frame positions have shifted:

1. Replace `frames.jpg` with the new photo (keep the same filename)
2. Deploy to Netlify
3. Open the live site — existing hotspots will likely be misaligned
4. Press **E** to enter editor mode
5. Delete misaligned hotspots (red **×**) and redraw them over the new frame positions
   — or drag/resize existing ones into the correct positions
6. Follow **Saving Hotspots** above

---

## Tooltip Format

`hotspots.json` is a JSON array. Each entry has:

```json
[
  {
    "x": 5.2,
    "y": 8.1,
    "w": 18.4,
    "h": 24.6,
    "tooltip": "Description shown on hover"
  }
]
```

`x`, `y`, `w`, `h` are percentages of the image width/height, so hotspots scale correctly at any screen size.
