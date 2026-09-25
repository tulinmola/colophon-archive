---
title: The Abduction of Oscar Z
description: A 2020 homebrew CPC platformer by Dreamin'bits, and winner of the #CPCRetroDev contest: you chase aliens across three scrolling levels to rescue Oscar's kidnapped farm animals.
---

## Description

The Abduction of Oscar Z is a homebrew Amstrad CPC platformer by Dreamin'bits (2020), and the winner of that year's #CPCRetroDev Game Creation Contest; it runs on a 64K CPC.

Young Oscar and three of his farm animals, including his dog Gunter, are abducted by a UFO and taken to an alien planet.

It's a fast right-scrolling run-and-jump game: you jump, slide under hovering aliens and burn energy for a speed boost, with a progress map showing how close you are to the boss alien. Across three levels, you must catch the alien before he reaches one of your animals, then knock him off his spacecraft and take it; fail and you replay the level.

Reviewers praise its colourful graphics, smooth animation and animated intro.

## Loading

The game arrives packed and takes itself apart before anything reaches the screen. Where it puts the pieces is the point: it writes over the memory the firmware keeps for its own workings. Nothing could have loaded them there from tape or disc, because loading is the firmware's job and those are the bytes it does the job with. They can only be put there afterwards, by a game that no longer needs it.

```js cell id="unpacked" uses="cpc" caption="The machine with the game unpacked"
const machine = await cpc({ model: 6128, snapshot: "abduction.sna" })

// The load arrives compressed, and the game unpacks it as it runs.
machine.runFrames(160)

return { state: machine.state() }
```

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

```js cell id="palette" from="unpacked" uses="cpc" caption="The palette and its faders"
const alias = { palettes: 0x3f80 }

const PALETTE_SIZE = 16,
  FADES = 8,
  SWATCH = 24,
  GAP = 2,
  HALF_GAP = GAP / 2

const machine = await cpc({ state: unpacked.state })

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

## The sprites

The sprites are kept in a format of the game's own, rlz3, and drawn by a routine of its own at `&22C2`. The game draws in mode 0, where a byte holds two pixels, and the format sorts every byte of a sprite into four kinds: empty, full, or holding only its left or only its right pixel. Each line is then a string of commands — skip up to four empty bytes, copy up to four full ones, or lay in a half-empty one through a mask — and the last command of a line says so. Nothing is spent on the holes, and nothing is masked that need not be.

The command byte is not looked up in a table. The drawer writes it into the offset of a jump just ahead of itself, so each command leaps straight into the code that carries it out. That speed has a price: the drawer only ever steps the low byte of its address, so a sprite's pixels must never cross a 256-byte page, and the game pads its data with zeros to keep them from doing it.

Every sprite starts with two bytes of size — its width in bytes, its height in lines — and the drawer is handed what follows. Here are all hundred and two, in forty-nine sets, one set to a line, over the blue of the first two levels.

```js cell id="sprites" from="palette unpacked" uses="cpc" caption="Every sprite the game holds"
const alias = {
  game_levels: 0x0467,
  renderer_drawRlz3_asm: 0x22c2
}

const sets = {
  subtitle: [0x4bac],
  copyright: [0x4da0],
  player_run: [0x4f4a, 0x4fcc, 0x5058, 0x50de, 0x5165, 0x51f2, 0x5279, 0x5302, 0x5383, 0x5406],
  player_run_fast: [0x548b, 0x54ff, 0x5573, 0x55df, 0x5659, 0x56dd],
  player_fly: [0x574d],
  player_fly_fast: [0x57d6],
  player_hit: [0x584d],
  player_jump: [0x58bd, 0x5916, 0x5992],
  player_fall: [0x5a1c],
  player_land: [0x5a93, 0x5b00],
  player_slide: [0x5b71, 0x5bf9, 0x5c7b],
  player_care: [0x5e12],
  egg: [0x7bab],
  fried_egg: [0x7bd6],
  player_ride: [0x7d7e, 0x7df9],
  earth: [0x9481],
  mars: [0x956a],
  slug: [0x99d8, 0x9a16, 0x9a4e, 0x9a78],
  birdie_hover: [0x9aec, 0x9b3d],
  birdie_ko: [0x9b8b],
  bird_hover: [0x9c5e, 0x9cdf],
  bird_expell: [0x9d5c],
  chicken_shot: [0x9e70],
  chicken_weak_shot: [0x9ea3],
  chicken_landed: [0x9eed],
  candy: [0x9f66, 0x9f9c, 0x9fdb, 0xa018],
  landmine: [0xa076, 0xa09a],
  landmine_explosion: [0xa0d2, 0xa123, 0xa158],
  player_damage: [0xa1e2],
  player_shoot: [0xa267],
  player_ko: [0xa308],
  heart: [0xa38c, 0xa3b1],
  animals_float: [0xa417, 0xa46d, 0xa4c5, 0xa521],
  animals_stand: [0xa583, 0xa5e0, 0xa63d, 0xa6a4],
  recharge_fx: [0xa73f, 0xa74e, 0xa763, 0xa77d, 0xa790, 0xa79c],
  shot_fx: [0xa7a8, 0xa7c5, 0xa7f7, 0xa82c, 0xa854],
  alien_hover: [0xa8c8, 0xa982, 0xaa38],
  alien_hover_left: [0xaae0, 0xab8d, 0xac3b],
  alien_mad: [0xacec, 0xada9],
  alien_shot: [0xae77],
  alien_recharge: [0xaf48],
  alien_ko: [0xb005],
  ufo: [0xb073],
  short_weed: [0xb1a6],
  shorter_weed: [0xb1dd],
  railing: [0xb209],
  platform_box: [0xb242],
  minefield_sign: [0xb270],
  spikes: [0xb2ee, 0xb305]
}

const SCREEN = 0xc000,
  SIZE_BYTES = 2,
  GAP_IN_BYTES = 2,
  CHARACTERS = 51,
  RASTERS = 8,
  BACKGROUND = 0,
  LEVEL_BACKGROUND_INKS = 2,
  FADES = 8

const machine = await cpc({ state: unpacked.state }),
  terms = { interrupts: false, withinFrames: 2 }

const skiesAt = alias.game_levels + LEVEL_BACKGROUND_INKS,
  skies = machine.ram[skiesAt] | (machine.ram[skiesAt + 1] << 8),
  inks = [...palette.inks]

inks[BACKGROUND] = machine.ram[skies + FADES - 1]

function draw(frames) {
  machine.ram.fill(0x00, SCREEN, 0x10000)

  let x = 0,
    tallest = 0

  for (const frame of frames) {
    machine.call(alias.renderer_drawRlz3_asm, { hl: frame + SIZE_BYTES, de: SCREEN + x, ...terms })

    x += machine.ram[frame] + GAP_IN_BYTES
    tallest = Math.max(tallest, machine.ram[frame + 1])
  }

  const rows = Math.ceil(tallest / RASTERS)

  return machine.video({
    start: SCREEN,
    characters: CHARACTERS,
    rows,
    rasters: RASTERS,
    mode: 0,
    inks
  })
}

const pictures = []

for (const frames of Object.values(sets)) {
  const reading = draw(frames),
    picture = new Image()

  picture.src = reading.image
  await picture.decode()

  pictures.push(picture)
}

let height = 0

for (const picture of pictures) {
  height += picture.naturalHeight
}

const sheet = document.createElement("canvas")

sheet.width = pictures[0].naturalWidth
sheet.height = height

const context = sheet.getContext("2d")

let y = 0

for (const picture of pictures) {
  context.drawImage(picture, 0, y)
  y += picture.naturalHeight
}

return { image: sheet.toDataURL("image/png"), inks }
```

## The animations

An animation is a list of steps, seven bytes each, ending where a step names no sprite. A step says which sprite to show, where to put it against the character's position, and how long to hold it. The game moves at twenty-five frames a second, and a step is held for a count of those.

```js cell id="animations" from="sprites unpacked" uses="cpc gif" caption="The player running"
const alias = {
  player_running: 0x5cfb,
  renderer_getScreenPointer_asm: 0x1672,
  renderer_drawRlz3_asm: 0x22c2
}

const STEP_SIZE = 7,
  STEP_SPRITE = 0,
  STEP_CX = 2,
  STEP_CY = 3,
  STEP_TIME = 4,
  SIZE_BYTES = 2,
  SCREEN_BANK = 0xc000,
  SCREEN_BYTES = 0x4000,
  CHARACTERS = 51,
  RASTERS = 8,
  PIXELS_PER_BYTE = 4,
  HUNDREDTHS_PER_GAME_FRAME = 4

const machine = await cpc({ state: unpacked.state }),
  terms = { interrupts: false, withinFrames: 2 }

function wordAt(at) {
  return machine.ram[at] | (machine.ram[at + 1] << 8)
}

function stepsOf(animation) {
  const steps = []

  for (let at = animation; wordAt(at + STEP_SPRITE) != 0; at += STEP_SIZE) {
    steps.push({
      sprite: wordAt(at + STEP_SPRITE),
      cx: machine.ram[at + STEP_CX],
      cy: machine.ram[at + STEP_CY],
      time: machine.ram[at + STEP_TIME]
    })
  }

  return steps
}

async function cropped(reading, width, height) {
  const picture = new Image()

  picture.src = reading.image
  await picture.decode()

  const canvas = document.createElement("canvas")

  canvas.width = width
  canvas.height = height

  const context = canvas.getContext("2d")

  context.drawImage(picture, 0, 0)

  return canvas.toDataURL("image/png")
}

function screenAt(x, y) {
  const answer = machine.call(alias.renderer_getScreenPointer_asm, { de: x, b: y, ...terms })

  return answer.hl
}

async function play(animation) {
  const steps = stepsOf(animation)

  let x = 0,
    y = 0

  for (const { cx, cy } of steps) {
    x = Math.max(x, cx)
    y = Math.max(y, cy)
  }

  let across = 0,
    down = 0

  for (const { sprite, cx, cy } of steps) {
    across = Math.max(across, x - cx + machine.ram[sprite])
    down = Math.max(down, y - cy + machine.ram[sprite + 1])
  }

  const origin = screenAt(0, 0),
    screen = origin & SCREEN_BANK,
    rows = Math.ceil(down / RASTERS),
    frames = []

  for (const { sprite, cx, cy, time } of steps) {
    machine.ram.fill(0x00, screen, screen + SCREEN_BYTES)

    const placed = screenAt(x - cx, y - cy)

    machine.call(alias.renderer_drawRlz3_asm, { hl: sprite + SIZE_BYTES, de: placed, ...terms })

    const reading = machine.video({
        start: origin,
        characters: CHARACTERS,
        rows,
        rasters: RASTERS,
        mode: 0,
        inks: sprites.inks
      }),
      image = await cropped(reading, across * PIXELS_PER_BYTE, down)

    frames.push({ image, hundredths: time * HUNDREDTHS_PER_GAME_FRAME })
  }

  return gif(frames)
}

const running = await play(alias.player_running)

return { image: running.image, play }
```

### The player

```js cell from="animations" caption="Running fast"
return animations.play(0x5d43)
```

```js cell from="animations" caption="Jumping"
return animations.play(0x5db1)
```

```js cell from="animations" caption="Landing"
return animations.play(0x5da1)
```

```js cell from="animations" caption="Flying"
return animations.play(0x5d6f)
```

```js cell from="animations" caption="Repelling"
return animations.play(0x5d7f)
```

```js cell from="animations" caption="Sliding"
return animations.play(0x5dc8)
```

```js cell from="animations" caption="Sliding fast"
return animations.play(0x5df4)
```

```js cell from="animations" caption="Riding"
return animations.play(0x7e72)
```

### The enemies

```js cell from="animations" caption="A slug, nervous"
return animations.play(0x9acb)
```

```js cell from="animations" caption="A slug, jumping"
return animations.play(0x9adb)
```

```js cell from="animations" caption="A birdie hovering"
return animations.play(0x9be1)
```

```js cell from="animations" caption="A birdie, hit"
return animations.play(0x9c37)
```

```js cell from="animations" caption="A bird hovering"
return animations.play(0x9df3)
```

```js cell from="animations" caption="A bird expelling"
return animations.play(0x9e49)
```

```js cell from="animations" caption="An alien hovering"
return animations.play(0xb0be)
```

```js cell from="animations" caption="An alien hovering, facing left"
return animations.play(0xb103)
```

```js cell from="animations" caption="An alien turning"
return animations.play(0xb0f3)
```

```js cell from="animations" caption="An alien turning, facing left"
return animations.play(0xb138)
```

```js cell from="animations" caption="An alien getting mad"
return animations.play(0xb148)
```

```js cell from="animations" caption="An alien shooting"
return animations.play(0xb15f)
```

```js cell from="animations" caption="An alien recharging"
return animations.play(0xb176)
```

### Everything else

```js cell from="animations" caption="The candies"
return animations.play(0xa058)
```

```js cell from="animations" caption="A landmine blinking"
return animations.play(0xa0c2)
```

```js cell from="animations" caption="A landmine going off"
return animations.play(0xa17b)
```

```js cell from="animations" caption="An animal floating"
return animations.play(0xa70a)
```

```js cell from="animations" caption="A shot"
return animations.play(0xa877)
```

```js cell from="animations" caption="A recharge"
return animations.play(0xa89c)
```

The heart has a trick of its own. Its last step is the same heart, placed far to the left, in the part of the screen the monitor never shows: that is how it vanishes between beats.

```js cell from="animations" caption="A heart beating"
return animations.play(0xa3e4)
```

## The levels

There are three levels, and an animal to rescue in each one.

```js cell id="levels" from="palette unpacked" uses="cpc"
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
  const machine = await cpc({ state: unpacked.state }),
    level = alias.game_levels + index * LEVEL_SIZE,
    terms = { interrupts: false, withinFrames: 30 }

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

const machine = await cpc({ state: unpacked.state })

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
