import type { Hover, Position } from 'vscode-languageserver/node.js';
import { findDirective } from '@swissjs/language-core/directives';
import { findLifecycleHook } from '@swissjs/language-core/lifecycle';
import { CAPABILITY_DOCS } from '@swissjs/language-core/capabilities';
import { getWordAtPosition } from '../parser/swiss-parser.js';

const KEYWORD_DOCS: Record<string, string> = {
  component: [
    '**`component Name { ... }`** — SwissJS Component Declaration',
    '',
    'Declares a SwissJS component class. Transforms to:',
    '```typescript',
    'export class Name extends SwissComponent { ... }',
    '```',
    'Component names must be PascalCase.',
  ].join('\n'),

  state: [
    '**`state { let x: T = v; }`** — Signal-backed Reactive State',
    '',
    'Each `let` declaration becomes a `Signal<T>`-backed getter/setter pair:',
    '```typescript',
    '// state { let count: number = 0; }',
    '// Compiles to:',
    'private _count$: Signal<number> = new Signal(0);',
    'private get count() { return this._count$.value; }',
    'private set count(v) { this._count$.value = v; }',
    '```',
  ].join('\n'),

  reactive: [
    '**`reactive let x: T`** — Reactive Field',
    '',
    'Declares a private reactive field on the component. Unlike `state { }`, reactive fields are not Signal-backed — they trigger re-renders when assigned.',
    '',
    'Transforms to:',
    '```typescript',
    'private x: T;',
    '```',
  ].join('\n'),

  computed: [
    '**`computed get x() { }`** — Computed Property',
    '',
    'Declares a private computed getter. Re-evaluates when its Signal dependencies change.',
    '',
    'Transforms to:',
    '```typescript',
    'private get x() { ... }',
    '```',
  ].join('\n'),

  props: [
    '**`props = { ... }`** — Static PropTypes',
    '',
    'Declares the expected input properties for this component.',
    '',
    'Transforms to:',
    '```typescript',
    'static propTypes = { ... }',
    '```',
  ].join('\n'),

  effect: [
    '**`effect { ... }`** — Reactive Effect',
    '',
    'Runs whenever any Signal dependency accessed inside the block changes. Similar to `createEffect()` in Solid.js.',
    '',
    'Transforms to:',
    '```typescript',
    'private effect() { ... }',
    '```',
  ].join('\n'),

  requires: [
    '**`@requires(...)`** — Capability Declaration',
    '',
    'Declares the security capabilities this component requires. The runtime will refuse to render the component without all required capabilities granted.',
    '',
    'Built-in capabilities: `network`, `analytics`, `payment`',
    '',
    '```typescript',
    "@requires('network', 'analytics')",
    'component PaymentWidget { ... }',
    '```',
  ].join('\n'),
};

export function computeHover(text: string, position: Position): Hover | null {
  const word = getWordAtPosition(text, position.line, position.character);

  if (!word) return null;

  // Swiss keywords
  if (word in KEYWORD_DOCS) {
    return {
      contents: { kind: 'markdown', value: KEYWORD_DOCS[word]! },
    };
  }

  // Lifecycle hooks
  const lifecycle = findLifecycleHook(word);
  if (lifecycle) {
    return {
      contents: {
        kind: 'markdown',
        value: [
          `**\`${lifecycle.keyword}\`** — Lifecycle Hook`,
          '',
          lifecycle.description,
          '',
          `Transforms to: \`${lifecycle.transformsTo}\``,
          lifecycle.supportsAsync ? '\n_Supports `async`._' : '',
        ].join('\n'),
      },
    };
  }

  // Directive names
  const directive = findDirective(word);
  if (directive) {
    return {
      contents: {
        kind: 'markdown',
        value: [
          `**\`${directive.name}\`** — SwissJS Directive`,
          '',
          directive.description,
          '',
          directive.aliases.length > 0
            ? `Aliases: ${directive.aliases.map((a) => `\`${a}\``).join(', ')}`
            : '',
        ].join('\n'),
      },
    };
  }

  // Capability names (network, analytics, payment)
  if (word in CAPABILITY_DOCS) {
    const cap = CAPABILITY_DOCS[word]!;
    return {
      contents: {
        kind: 'markdown',
        value: [
          `**Capability: \`${cap.name}\`**`,
          '',
          cap.description,
          '',
          `Example: \`${cap.example}\``,
        ].join('\n'),
      },
    };
  }

  return null;
}
