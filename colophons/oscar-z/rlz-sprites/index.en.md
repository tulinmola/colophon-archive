---
title: The RLZ sprites
description: A sprite format that cannot be read without running the routine that reads it, and what the method recovers of it unaided.
order: 1
work: The Abduction of Oscar Z
witness: not yet deposited
---

Most formats can be read twice: once by the program that owns them, and once by whoever works out the grammar from outside. This one declines the second reading. Its sprites are not laid down in any shape a parser can be written against — they are laid down for the routine that draws them, and the routine is the only reader there has ever been.

Which makes them the plainest test the method has, and the reason this is the archive's first colophon rather than its tenth. Either the machine can be made to hand over what the routine drew, or the format is unreadable and the archive's whole argument is smaller than it claims.

## Where this stands

Nothing below has been derived. This document is a skeleton: the sections are here so that the shape of a colophon can be argued with before there is any apparatus to fill one in, and each of them says what it is still waiting for. **No cell in this document runs.**

## The witness

The witness is the released game, named by its hash, and it is not deposited yet.

The snapshot this work will actually be done from is not the witness. A snapshot is a derived thing — somebody made it, from something, at a moment they chose — and if the register named it as the origin the provenance would begin in mid-air. It is recorded instead as an artifact, with the procedure that produced it, hanging from the release the way everything else does.

## The constants

An address earns a line here the day it is found in the machine, and not before.

The symbol table this game was built with is held back as the answer key. It says where everything is, and nothing in this colophon may be derived from it; it is opened once, at the end, to grade what the method recovered without it. A symbol file is the author's testimony, not evidence drawn from the binary, and almost nothing published in the eight-bit era left one behind.

So the table is empty, and the cell below cannot run until it is not.

| Address | What it is | How it was found |
| ------- | ---------- | ---------------- |

## The derivation

The shape a cell is expected to take, once there is a machine to run one: the snapshot is loaded, the argument the routine expects is written where it expects it, the routine is called and run until it returns, and the picture is taken from the machine's own video path rather than decoded a second time by us.

```{js}
const machine = archive.load(SNAPSHOT)

machine.poke(SPRITE_INDEX, 0)
machine.call(DRAWER)

artifact("sprite-0.png", machine.screen())
```

Every name in capitals is a constant the table above does not yet hold. That the cell will not run is not an accident of it being unfinished — it is the dependency working: no address, no derivation.

## What this does not prove

To be written once there is something to qualify. A colophon that cannot say what its evidence fails to settle has not finished arguing.
