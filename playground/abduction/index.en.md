---
title: The Abduction of Oscar Z
description: A 2020 homebrew CPC platformer by Dreamin'bits, and winner of the #CPCRetroDev contest: you chase aliens across three scrolling levels to rescue Oscar's kidnapped farm animals.
---

## Description

The Abduction of Oscar Z is a homebrew Amstrad CPC platformer by Dreamin'bits (2020), and the winner of that year's #CPCRetroDev Game Creation Contest; it runs on a 64K CPC.

Young Oscar and three of his farm animals, including his dog Gunter, are abducted by a UFO and taken to an alien planet.

It's a fast right-scrolling run-and-jump game: you jump, slide under hovering aliens and burn energy for a speed boost, with a progress map showing how close you are to the boss alien. Across three levels, you must catch the alien before he reaches one of your animals, then knock him off his spacecraft and take it; fail and you replay the level.

Reviewers praise its colourful graphics, smooth animation and animated intro.

## The main menu

The main menu, as a player meets it.

```js cell uses="cpc" caption="The main menu"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna", monitor: true })

machine.runFrames(200)

return machine.monitor()
```

Every edge of that picture is filled, looking like a full overscan screen. But an overscan screen should take 32K, and this game works on a 64K CPC. Half the whole RAM would go just to screen memory!

It does not pay that. What looks like one picture is the game's own engine running **two screens**, one standing above the other, with a background colour chosen well enough to hide the seam. Look closely and you can find it.

The top 40 lines are a screen of their own at `&8000`, 4K of memory. In play this is where the HUD sits.

```js cell uses="cpc" caption="The HUD screen"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna" })

machine.runFrames(160)

return machine.video()
```

The rest is the other screen, at `&C000`: 160 lines and 16K of it, wider than the monitor ever shows. This is the game's screen proper.

```js cell uses="cpc" caption="The game screen"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna" }),
  inks = [
    0x14, 0x14, 0x04, 0x0e, 0x18, 0x0c, 0x0d, 0x16, 0x00, 0x15, 0x07, 0x0f, 0x13, 0x1a, 0x0a, 0x0b
  ]

machine.runFrames(149)

return machine.video({ start: 0xc000, characters: 51, rows: 20, rasters: 8, mode: 0, inks })
```

But why wider than the monitor shows? It is a classic trick for not cropping sprites at the edges. If nobody can see what is out there, a sprite leaving one side never has to be stopped from coming back, broken, on the other. Cropping is expensive: it means a second set of drawing routines. Abduction's are built for fast span drawing on a hardware-scrolled screen, and having to draw only part of a sprite would break those optimisations.

Everything left over is border, which costs nothing at all. 4 + 16 = 20K, for a screen that looks like 32!

## The palette and its fades

The game's 16 colours, like any other CPC mode 0 game. But moving from one section to the next, it fades the screen out and back in. To make that fade beautiful there are 8 hand-crafted palettes, running from pitch black up to the full thing.

```js cell id="palette" uses="cpc" caption="The palette and its faders"
const alias = { palettes: 0x3f80 }

const PALETTE_SIZE = 16,
  FADES = 8,
  SWATCH = 24,
  GAP = 2,
  HALF_GAP = GAP / 2

const machine = await cpc({ model: 6128, snapshot: "abduction.sna" })

// The load arrives compressed, and the game unpacks it as it runs.
machine.runFrames(160)

// interrupts_startFadeIn walks up these eight and interrupts_startFadeOut
// walks back down, a palette to a frame. renderer_setBackgroundInks writes pen
// zero of each from the standing level's own list.
const canvas = document.createElement("canvas")

canvas.width = PALETTE_SIZE * (SWATCH + GAP)
canvas.height = FADES * (SWATCH + GAP)

const context = canvas.getContext("2d")

for (let fade = 0; fade < FADES; fade++) {
  for (let pen = 0; pen < PALETTE_SIZE; pen++) {
    const code = machine.ram[alias.palettes + fade * PALETTE_SIZE + pen],
      colour = machine.rgb(code)

    context.fillStyle = `#${colour.toString(16).padStart(6, "0")}`
    context.fillRect(
      HALF_GAP + pen * (SWATCH + GAP),
      HALF_GAP + fade * (SWATCH + GAP),
      SWATCH,
      SWATCH
    )
  }
}

const faded = alias.palettes + (FADES - 1) * PALETTE_SIZE,
  inks = [...machine.ram.slice(faded, faded + PALETTE_SIZE)]

return { image: canvas.toDataURL("image/png"), inks }
```

The leftmost colour is the background. It changes with the level, taking its column from one of the others: black in the menu, blue for the first and second levels, purple for the last.

## The levels

There are three levels, and an animal to rescue in each one.

```js cell id="levels" from="palette" uses="cpc"
const alias = {
  game_levels: 0x0467,
  renderer_getScreenPointer_asm: 0x1672,
  terrain_clear: 0x147a,
  terrain_step: 0x14e2,
  renderer_drawStain_asm: 0x1839,
  water_clear: 0x1a47,
  water_step: 0x1a89,
  renderer_newSpansStain: 0x2582,
  renderer_clear_asm: 0x25f1,
  renderer_move: 0x2836,
  platform_clear: 0x2992,
  platform_step: 0x29ca,
  background_clear: 0x2b13,
  background_step: 0x2b28
}

const LEVEL_SIZE = 32,
  LEVEL_BACKGROUND_INKS = 2,
  LEVEL_NAME = 6,
  LEVEL_ENDING = 26,
  LEVELS = 3,
  FADES = 8,
  SCREEN_WIDTH_IN_BYTES = 102,
  SCREENS_TO_A_BAND = 8

function wordIn(ram, at) {
  return ram[at] | (ram[at + 1] << 8)
}

function nameIn(ram, at) {
  const letters = []

  for (let step = 0; ram[at + step] != 0; step++) {
    letters.push(String.fromCharCode(ram[at + step]))
  }

  return letters.join("")
}

const draw = async function (index) {
  const machine = await cpc({ model: 6128, snapshot: "abduction.sna" }),
    level = alias.game_levels + index * LEVEL_SIZE,
    terms = { interrupts: false, withinFrames: 30 }

  // The load arrives compressed, and the game unpacks it as it runs.
  machine.runFrames(160)

  // game_start's own clears, less the ones a drawing does not need.
  machine.call(alias.renderer_clear_asm, { ix: level, hl: 0, ...terms })
  machine.call(alias.terrain_clear, { hl: level, ...terms })
  machine.call(alias.platform_clear, { hl: level, ...terms })
  machine.call(alias.water_clear, { hl: level, ...terms })
  machine.call(alias.background_clear, terms)

  const inks = [...palette.inks],
    skies = wordIn(machine.ram, level + LEVEL_BACKGROUND_INKS)

  // The last of the level's eight, the fade being over.
  inks[0] = machine.ram[skies + FADES - 1]

  // success_step watches for this position to pass renderer_left.
  const ending = wordIn(machine.ram, level + LEVEL_ENDING),
    screens = Math.ceil(ending / SCREEN_WIDTH_IN_BYTES),
    bands = Math.ceil(screens / SCREENS_TO_A_BAND)

  const canvas = document.createElement("canvas")

  canvas.width = SCREENS_TO_A_BAND * SCREEN_WIDTH_IN_BYTES * 4
  canvas.height = bands * 160

  const context = canvas.getContext("2d")

  for (let screen = 0; screen < screens; screen++) {
    if (screen > 0) {
      machine.call(alias.renderer_move, { l: SCREEN_WIDTH_IN_BYTES, ...terms })
    }

    // game_step's own order.
    machine.call(alias.water_step, terms)
    machine.call(alias.terrain_step, terms)
    machine.call(alias.background_step, terms)
    machine.call(alias.platform_step, terms)

    machine.call(alias.renderer_drawStain_asm, { ix: alias.renderer_newSpansStain, ...terms })

    const left = screen * SCREEN_WIDTH_IN_BYTES,
      answer = machine.call(alias.renderer_getScreenPointer_asm, { de: left, b: 0, ...terms }),
      reading = machine.video({
        start: answer.hl,
        characters: 51,
        rows: 20,
        rasters: 8,
        mode: 0,
        inks
      }),
      picture = new Image()

    picture.src = reading.image
    await picture.decode()

    const band = Math.floor(screen / SCREENS_TO_A_BAND),
      along = screen % SCREENS_TO_A_BAND

    context.drawImage(picture, along * picture.naturalWidth, band * picture.naturalHeight)
  }

  return { image: canvas.toDataURL("image/png") }
}

const machine = await cpc({ model: 6128, snapshot: "abduction.sna" })

machine.runFrames(160)

const names = []

for (let index = 0; index < LEVELS; index++) {
  const level = alias.game_levels + index * LEVEL_SIZE,
    named = wordIn(machine.ram, level + LEVEL_NAME)

  names.push(nameIn(machine.ram, named))
}

return { names, draw }
```

### Level 1, rescue Mizzie

The shortest of the three and the kindest: birds, mines, platforms, and water not to be touched. Mizzie the sheep is waiting at the end.

```js cell from="levels" caption="Mizzie's level, whole"
return levels.draw(0)
```

### Level 2, rescue Donald

The second brings new enemies: big birds with a weird way of spelling, and slugs. Donald the duck is waiting at the end of this one.

```js cell from="levels" caption="Donald's level, whole"
return levels.draw(1)
```

### Level 3, rescue Gunter!

The last is the longest and the hardest, and your loyal friend Gunter is at the end of it.

```js cell from="levels" caption="Gunter's level, whole"
return levels.draw(2)
```
