# Add SwissJS language support to GitHub Linguist

## What is SwissJS?

SwissJS is a component-oriented UI language and framework for building web applications. It uses `.ui` and `.uix` file extensions for component files that combine:

- **Swiss syntax** — a high-level component DSL (`component`, `state`, `reactive`, `computed`, `mount`, `unmount`, `effect`) that compiles to TypeScript class syntax
- **Embedded HTML** — via `html\`...\`` tagged template literals
- **Embedded CSS** — via `css\`...\`` tagged template literals
- **Reactive primitives** — Signals, computed properties, reactive effects
- **Capability system** — security-gated component capabilities (`@requires('network')`)

SwissJS is similar in positioning to Vue (`.vue`), Svelte (`.svelte`), and Astro (`.astro`) — single-file component formats with custom syntax that transpile to JavaScript.

## Why `.ui` and `.uix`?

- `.ui` — SwissJS UI component files (primary component format)
- `.uix` — SwissJS UIX files (JSX-first component variant)

`.uix` is unambiguous and exclusively SwissJS. `.ui` conflicts with Qt Designer (XML-based). The heuristics in this PR resolve the conflict cleanly.

## What does SwissJS code look like?

```typescript
// Counter.ui
import { Signal } from '@swissjs/core';

component Counter {
  state {
    let count: number = 0;
  }

  computed get doubled() {
    return this.count * 2;
  }

  mount {
    console.log('mounted');
  }

  render() {
    return html`
      <div>
        <p>Count: ${this.count}</p>
        <button onclick="${() => this.count++}">+</button>
      </div>
    `;
  }
}
```

## Files changed in this PR

- `lib/linguist/languages.yml` — Add SwissJS language definition
- `lib/linguist/heuristics.rb` — Disambiguate `.ui` between SwissJS and Qt Designer
- `samples/SwissJS/component.ui` — Real-world component example
- `samples/SwissJS/reactive.ui` — Reactive state example
- `samples/SwissJS/capability.ui` — Capability-gated component example

## Precedents

This follows the same pattern established for:
- Vue (`.vue`) — merged in [linguist PR #xxxx]
- Svelte (`.svelte`) — merged in [linguist PR #xxxx]
- Astro (`.astro`) — merged in [linguist PR #xxxx]

## TextMate grammar reference

The canonical grammar is at: `https://github.com/kibologic/swiss-devtools/packages/grammars/src/textmate/swissjs.tmLanguage.json`

Scope name: `source.swissjs`

## Heuristic conflict resolution

`.ui` conflicts only with Qt Designer. The heuristic is reliable:
- Qt Designer files are XML and always start with `<?xml` + `<ui version=`
- SwissJS files contain identifiable patterns (`component`, `state`, `@requires`, `reactive let`)

No false positives are expected.
