# Colophon Archive — agent instructions

The desk where colophons are written, and the tools for writing them. The machine lives in `colophon-emulator` and the page that carries it in `colophon-player`, both under their own instructions; read those before touching anything that crosses into either. `README.md` is the prologue.

## The constraint everything follows from

A witness cannot leave the machine that holds it. The games are other people's, so no server, no CI and no published page may hold one. Derivation happens where the witness is — an author's machine, a reviewer's, a reader's browser holding their own copy — and the record is what crosses to the machines without it.

- `generator/` is Node. It composes markup and never executes a cell, and must run with no Vite in the process, because CI calls it directly.
- `src/js/executor.js` is host-neutral: no `document`, no `node:` anything, plain ESM, relative imports, no bare specifiers.
- `src/js/` is the browser's alone. A cell is a `<colophon-cell>`, which builds its own controls: the generator emits the element and the code inside it, never the interface. An element that has not upgraded renders its children, so a page with no script is the code alone.
- Vite is the dev server, never the renderer.

A published page reads with no execution at all: the statics are the publication and the button is the invitation. The Colophon Project gathers the colophons and dresses them; what is served here is a plainer preview.

## Evidence

- A symbol file is testimony, not evidence. A cell addresses a routine by literal, because the address is the finding.
- A snapshot is not a witness. The witness is the released work, named by its hash; a snapshot hangs from it as an artifact.
- Measurements are ours. Screenshots and short extracts are quotation. Snapshots, disc images and complete listings are never published.
- An artifact lives in the colophon that cites it, never in a shared library.
- A cell is a fenced block whose language is braced, which is Quarto's spelling: every other renderer leaves an unknown language alone, so a cell degrades to a plain code block wherever else it is read.
- A cell runs on its own. Checking one claim must never mean running five others first.

## Code

- An `if` takes a name or one call — `if (isCell)`, `if (!page)` — never a built-up expression. Hoist the expression to a boolean above it, named for what is true rather than for how it was decided.
- Never pass a call's result straight into another call; hoist it to a named `const`.
- Never hide a real error in a guard. Check only what can legitimately vary at runtime — input from the network, a file being written. Checking what this repository owns turns our bug into silence.
- Markup is composed by the `html` tag, which exists so that Prettier formats what is inside it. Text is escaped where it is interpolated, with `escapeHtml`.
- A folder's `index.js` is its surface and where reading starts. Everything else in the folder is internal and imports its siblings directly.
- The export shape is the module's contract: `default` where the module is one thing, named where it offers several, never both. Mixing hands the caller a decision that was ours to make.
- A comment is a battle the code lost, and the fix is never the comment. A name that does not say what the thing is: rename it. A diary entry nobody wants on Thursday: delete it. A claim about the code: it is a lie already or will become one. Worst, a design that has to be argued for in prose to be understood: prose is where that argument hides instead of being settled, so settle it. What survives is a fact no name can carry — an upstream constraint, a clause of a spec — and there is one such fact here, standing in both copies of `html.js`. In a test the name is that slot: a comment above one is a name that was not found.
- Prefer `==`, and `===` only where strictly needed. `for...of` unless index arithmetic is wanted; avoid `.forEach`. Prefer `function` over arrows except for a short single expression.
- Plain CSS: custom properties, nesting, `light-dark()`.
- Structure follows need. Build nothing for a consumer that does not exist.

## Voice

- A scribe's register: plain, declarative, a little antique. Take the metaphor seriously and never wink at it.
- Mood at the openings, discipline in the middles.
- Prose earns its place. Minimum, load-bearing only — an explanation nobody needs is a dev log with a date on it.
- One paragraph, one line. Markdown is never hard-wrapped.
- Write for 2036.

## Working

- `npm start` serves on localhost. Through the workspace proxy: `npx vite --config ../vite-workspace.config.js`, because the host is the workspace's and never enters this repository.
- `npm run check` before handing work back: Prettier, ESLint and the tests.
- Tests cover what the browser cannot be asked about cheaply — escaping, the fence rule, error paths — and the executor, whose whole claim is that it runs with no document in sight. A module gets its tests in the commit that writes it.
- Never commit, never push. The human reviews; the human commits.

## Unsettled

What the element does in a browser, which nothing in this repository yet checks. What a recorded result looks like on disk. Running a stranger's code — and rendering it, since markdown-it is configured with `html: true` and a colophon body may carry markup of its own.
