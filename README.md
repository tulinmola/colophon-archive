# Colophon Archive

## Prologue

The scribe wrote the colophon last. The copying was done and the quires were gathered, and at the foot of the final page went the note: whose hand, from which exemplar, where, and when — and often enough, who had read it back against the copy it was taken from.

The games of the 8-bit era never got that note. This is the desk where it is written.

The [emulator](https://github.com/tulinmola/colophon-emulator) is the instrument, and the [player](https://github.com/tulinmola/colophon-player) is where a machine is watched while it runs. Here a finding is made into an argument: the claim, the cells that derive it, the artifacts they produce, and the copy they were read from, named by its hash. The tools for that work are written here too, as the colophons come to need them.

Nothing is published that a second reader has not checked against the same copy.

The colophons are gathered and published by [The Colophon Project](https://github.com/tulinmola/colophon-project).

## Building

Node and npm are the whole toolchain, and there is nothing to build: a colophon is markdown, and it is rendered on the request that asks for it.

```sh
npm install
npm start        # serve the colophons, reloading as they are written
npm run check    # formatting and linting
```

`npm start` reloads the page when a file changes, so writing a colophon is editing it and looking at it. What it serves is the archive's own preview and not the published page: the colophons are gathered and published by [The Colophon Project](https://github.com/tulinmola/colophon-project), which owns their addresses and how they are dressed. The preview is deliberately plainer, so that the two are never mistaken for one another.

## Where it stands

A colophon can be written and looked at. Nothing can be derived yet.

The first of them is a skeleton. It sets out the sections a colophon is expected to carry — the witness it was read from, the constants it found, the derivation that found them, and what the evidence fails to settle — and holds none of them, so that the shape can be argued with before there is any apparatus to fill one in. No cell runs.

The tools are to be learned from the first colophons rather than designed ahead of them.

## License

MIT, like the rest of Colophon.
