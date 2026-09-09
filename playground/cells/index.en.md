---
title: Cells
description: What a cell is, what runs it, and where.
---

Not a colophon. The place the apparatus is tried on things whose answers are already known.

## A cell

An element holding one block of code. What it answers is what a reader came for; the working is folded away for whoever came to check.

```js cell
return 2 + 2
```

## Where it runs

In the browser, when a reader asks. Nothing is executed while the page is built or served — this one answers `"object"` here and would answer `"undefined"` in Node.

```js cell
return typeof window
```

## What a cell derives from another

A cell is named by its `id`, and one that rests on another says so with `from`. Nothing is shared between them: the value arrives bound to the name of the cell it came from, and to nothing else.

```js cell id="two"
return 2
```

```js cell id="sum" from="two"
return two + 2
```

Run the one below and the cells it derives from run too, in the open, each answering under its own block. A cell may derive only from one written above it.

```js cell from="two sum"
return two * sum
```

## What the source says

Whatever the prose around a cell cannot. A comment is read by whoever opened the working, which is where an account of the apparatus belongs rather than in the page.

```js cell
// A cell is a function body: it may declare, it may await, and it returns
// what it found. How far that goes is JSON, and no further, for now.
const doubled = [1, 2, 3].map(each => each * 2)

return doubled
```

## When it fails

The failure is the result.

```js cell id="broken"
return missing.value
```

A cell deriving from one that failed says so, rather than running short of what it was promised.

```js cell from="broken"
return "never reached"
```
