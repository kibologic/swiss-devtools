import {
  type CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from 'vscode-languageserver/node.js';
import { SWISS_KEYWORDS, SWISS_TEMPLATE_TAGS } from '@swissjs/language-core/syntax';
import { LIFECYCLE_HOOKS } from '@swissjs/language-core/lifecycle';
import { DIRECTIVES } from '@swissjs/language-core/directives';
import { BUILTIN_CAPABILITIES, SWISS_DECORATORS } from '@swissjs/language-core/capabilities';
import { getContextAtPosition } from '../parser/swiss-parser.js';

export function computeCompletions(
  text: string,
  line: number,
  character: number,
): CompletionItem[] {
  const context = getContextAtPosition(text, line, character);

  switch (context) {
    case 'decorator':
      return decoratorCompletions();
    case 'jsx-attr':
      return directiveCompletions();
    default:
      return generalCompletions();
  }
}

function decoratorCompletions(): CompletionItem[] {
  const items: CompletionItem[] = [];

  for (const dec of SWISS_DECORATORS) {
    items.push({
      label: `@${dec.name}`,
      kind: CompletionItemKind.Function,
      detail: 'SwissJS Decorator',
      documentation: dec.description,
      insertText: dec.name === 'requires'
        ? `requires('\${1:network}')\$0`
        : dec.name === 'query' || dec.name === 'queryAll'
          ? `${dec.name}('\${1:selector}')\$0`
          : `${dec.name}`,
      insertTextFormat: InsertTextFormat.Snippet,
    });
  }

  return items;
}

function directiveCompletions(): CompletionItem[] {
  return DIRECTIVES.flatMap((d) =>
    [d.name, ...d.aliases].map((name) => ({
      label: name,
      kind: CompletionItemKind.Property,
      detail: 'SwissJS Directive',
      documentation: d.description,
      insertText: `${name}={\${1:expression}}\$0`,
      insertTextFormat: InsertTextFormat.Snippet,
    })),
  );
}

function generalCompletions(): CompletionItem[] {
  const items: CompletionItem[] = [];

  // Swiss keyword blocks — snippet completions
  items.push({
    label: 'component',
    kind: CompletionItemKind.Keyword,
    detail: 'SwissJS Component',
    documentation: 'Declares a new SwissJS component class. Transforms to `export class Name extends SwissComponent { ... }`.',
    insertText: 'component ${1:ComponentName} {\n\t$0\n}',
    insertTextFormat: InsertTextFormat.Snippet,
  });

  items.push({
    label: 'state',
    kind: CompletionItemKind.Keyword,
    detail: 'SwissJS State Block',
    documentation: 'Declares Signal-backed reactive state fields.',
    insertText: 'state {\n\tlet ${1:count}: ${2:number} = ${3:0};\n}$0',
    insertTextFormat: InsertTextFormat.Snippet,
  });

  items.push({
    label: 'reactive',
    kind: CompletionItemKind.Keyword,
    detail: 'SwissJS Reactive Variable',
    documentation: 'Declares a reactive field. Transforms to a private class field.',
    insertText: 'reactive let ${1:name}: ${2:string} = ${3:""};$0',
    insertTextFormat: InsertTextFormat.Snippet,
  });

  items.push({
    label: 'computed',
    kind: CompletionItemKind.Keyword,
    detail: 'SwissJS Computed Property',
    documentation: 'Declares a computed getter. Transforms to a private TypeScript getter.',
    insertText: 'computed get ${1:value}() {\n\treturn $0;\n}',
    insertTextFormat: InsertTextFormat.Snippet,
  });

  items.push({
    label: 'props',
    kind: CompletionItemKind.Keyword,
    detail: 'SwissJS Props Declaration',
    documentation: 'Declares the static propTypes for this component.',
    insertText: 'props = {\n\t${1:label}: String,\n};$0',
    insertTextFormat: InsertTextFormat.Snippet,
  });

  // Lifecycle hooks
  for (const hook of LIFECYCLE_HOOKS) {
    items.push({
      label: hook.keyword,
      kind: CompletionItemKind.Method,
      detail: `SwissJS Lifecycle — ${hook.transformsTo}`,
      documentation: hook.description,
      insertText: hook.supportsAsync
        ? `${hook.keyword}() {\n\t$0\n}`
        : `${hook.keyword} {\n\t$0\n}`,
      insertTextFormat: InsertTextFormat.Snippet,
    });

    if (hook.supportsAsync) {
      items.push({
        label: `async ${hook.keyword}`,
        kind: CompletionItemKind.Method,
        detail: `SwissJS Async Lifecycle — ${hook.transformsTo}`,
        documentation: hook.description,
        insertText: `async ${hook.keyword}() {\n\t$0\n}`,
        insertTextFormat: InsertTextFormat.Snippet,
      });
    }
  }

  // Tagged template tags
  for (const tag of SWISS_TEMPLATE_TAGS) {
    items.push({
      label: `${tag}\`\``,
      kind: CompletionItemKind.Function,
      detail: tag === 'html' ? 'Embedded HTML template' : 'Embedded CSS template',
      documentation: `Tagged template literal for embedded ${tag.toUpperCase()}.`,
      insertText: `${tag}\`\${1}\`$0`,
      insertTextFormat: InsertTextFormat.Snippet,
    });
  }

  // Capability names (usable in @requires(...))
  for (const cap of BUILTIN_CAPABILITIES) {
    items.push({
      label: `'${cap}'`,
      kind: CompletionItemKind.EnumMember,
      detail: 'SwissJS Built-in Capability',
      insertText: `'${cap}'`,
    });
  }

  return items;
}

export function computeCapabilityCompletions(): CompletionItem[] {
  return BUILTIN_CAPABILITIES.map((cap) => ({
    label: cap,
    kind: CompletionItemKind.EnumMember,
    detail: 'SwissJS capability',
    insertText: `'${cap}'`,
  }));
}
