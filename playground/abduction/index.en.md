---
title: Abduction – The screens
description: The Abduction screen geometries
---

The menu, as a player meets it. It looks like one screen; it is two.

```js cell uses="cpc"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna", monitor: true })

machine.runFrames(200)

return machine.monitor()
```

The top forty lines are a screen of their own at &8000 — fifty characters across, twenty rows of two rasters — the band the game keeps for its status line, holding the title while the menu is up.

```js cell uses="cpc"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna" })

machine.runFrames(160)

return machine.video()
```

The rest is the other screen, at &C000: fifty-one characters across, twenty rows of eight rasters, a hundred and sixty lines. Forty and a hundred and sixty make the two hundred of a whole screen, and the CRTC is turned from one to the other partway down every frame. What it holds when a frame ends is the band above, which is why this screen's counts are written out and the other's are not.

```js cell uses="cpc"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna" }),
  inks = [
    0x14, 0x14, 0x04, 0x0e, 0x18, 0x0c, 0x0d, 0x16, 0x00, 0x15, 0x07, 0x0f, 0x13, 0x1a, 0x0a, 0x0b
  ]

machine.runFrames(149)

return machine.video({ start: 0xc000, characters: 51, rows: 20, rasters: 8, mode: 0, inks })
```
