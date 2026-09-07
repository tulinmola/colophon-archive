---
title: Cells
description: What a cell is, what runs it, and where.
---

Not a colophon. The place the apparatus is tried on things whose answers are already known.

## A cell

A fenced block whose language is braced. Every other block is shown and nothing more.

```{js}
return 2 + 2
```

## What runs

The characters above, read out of the page by the button beneath them. What is cited and what is executed are the same text.

```{js}
const doubled = [1, 2, 3].map(each => each * 2)

return doubled
```

## Where it runs

In the browser, when a reader asks. Nothing is executed while the page is built or served — this cell answers `"object"` here and would answer `"undefined"` in Node.

```{js}
return typeof window
```

## When it fails

The failure is the result.

```{js}
return missing.value
```
