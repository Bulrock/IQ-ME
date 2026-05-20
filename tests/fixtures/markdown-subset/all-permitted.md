# All permitted constructs

This positive fixture exercises every construct permitted by `corpus/markdown-subset-v1.md`. The contract spec `tests/contract/markdown-subset-strict-mode.spec.mjs` parses this file and asserts the renderer accepts it.

## Level-two heading

A paragraph with *emphasis*, **strong emphasis**, and `inline code`.

### Level-three heading

Another paragraph linking inline to [the home page](/). Reference-style links also work, like [the spec][spec].

#### Level-four heading

A short paragraph for depth-four coverage.

## Code fences

A fence without a language:

```
plain fence body
```

A fence with a language tag:

```js
const x = 1;
```

## Lists

An unordered list with nested depth-two children:

- top level a
  - nested a-1
  - nested a-2
- top level b

An ordered list with nested depth-two children:

1. first
   1. first-nested
   2. second-nested
2. second

## Closing

A final paragraph referencing the spec at [spec][spec] one more time.

[spec]: /corpus/markdown-subset-v1
