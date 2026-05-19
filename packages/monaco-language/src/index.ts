import type * as Monaco from 'monaco-editor';
import { swissjsMonarch, SWISS_LANGUAGE_CONFIG } from '@swissjs/grammars/monarch';
import { SWISS_KEYWORDS } from '@swissjs/language-core/syntax';
import { LIFECYCLE_KEYWORDS } from '@swissjs/language-core/lifecycle';
import { DIRECTIVE_NAMES } from '@swissjs/language-core/directives';
import { BUILTIN_CAPABILITIES } from '@swissjs/language-core/capabilities';

export const LANGUAGE_ID = 'swissjs';

export function registerSwissJS(monaco: typeof Monaco): void {
  // Register language
  monaco.languages.register({
    id: LANGUAGE_ID,
    extensions: ['.ui', '.uix'],
    aliases: ['SwissJS', 'swissjs'],
    mimetypes: ['text/swissjs'],
  });

  // Apply Monarch tokenizer
  monaco.languages.setMonarchTokensProvider(LANGUAGE_ID, swissjsMonarch as Monaco.languages.IMonarchLanguage);

  // Apply language configuration
  monaco.languages.setLanguageConfiguration(LANGUAGE_ID, SWISS_LANGUAGE_CONFIG as Monaco.languages.LanguageConfiguration);

  // Register completion provider
  monaco.languages.registerCompletionItemProvider(LANGUAGE_ID, {
    triggerCharacters: ['@', '.', '<', ' ', '"', "'"],
    provideCompletionItems(model, position) {
      return buildCompletions(monaco, model, position);
    },
  });

  // Register hover provider
  monaco.languages.registerHoverProvider(LANGUAGE_ID, {
    provideHover(model, position) {
      return buildHover(model, position);
    },
  });
}

function buildCompletions(
  monaco: typeof Monaco,
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
): Monaco.languages.CompletionList {
  const word = model.getWordAtPosition(position);
  const lineText = model.getLineContent(position.lineNumber);
  const beforeCursor = lineText.slice(0, position.column - 1);

  const range: Monaco.IRange = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word?.startColumn ?? position.column,
    endColumn: word?.endColumn ?? position.column,
  };

  const items: Monaco.languages.CompletionItem[] = [];

  const inDecorator = /@\w*$/.test(beforeCursor);
  const inJsxAttr = /<\w+\s+[^>]*$/.test(beforeCursor);

  if (inDecorator) {
    items.push({
      label: '@requires',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "requires('${1:network}')",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: 'Declare required capabilities for this component.',
      range,
    });
    items.push({
      label: '@capability',
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: "capability('${1:name}')",
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      range,
    });
    return { suggestions: items };
  }

  if (inJsxAttr) {
    for (const dir of DIRECTIVE_NAMES) {
      items.push({
        label: dir,
        kind: monaco.languages.CompletionItemKind.Property,
        insertText: `${dir}={\${1:expression}}`,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
        documentation: `SwissJS directive: ${dir}`,
        range,
      });
    }
    return { suggestions: items };
  }

  // General completions
  for (const kw of SWISS_KEYWORDS) {
    items.push({
      label: kw,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: kw,
      range,
    });
  }

  for (const hook of LIFECYCLE_KEYWORDS) {
    items.push({
      label: hook,
      kind: monaco.languages.CompletionItemKind.Method,
      insertText: `${hook} {\n\t$0\n}`,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      documentation: `SwissJS lifecycle: ${hook}`,
      range,
    });
  }

  for (const cap of BUILTIN_CAPABILITIES) {
    items.push({
      label: cap,
      kind: monaco.languages.CompletionItemKind.EnumMember,
      insertText: `'${cap}'`,
      documentation: `SwissJS capability: ${cap}`,
      range,
    });
  }

  return { suggestions: items };
}

function buildHover(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
): Monaco.languages.Hover | null {
  const word = model.getWordAtPosition(position);
  if (!word) return null;

  const HOVER_DOCS: Record<string, string> = {
    component: '**`component Name { }`** — Declares a SwissJS component. Transforms to `export class Name extends SwissComponent { }`.',
    state: '**`state { let x: T = v; }`** — Declares Signal-backed reactive state. Each field becomes a `Signal<T>` getter/setter pair.',
    reactive: '**`reactive let x: T`** — Declares a reactive private field.',
    computed: '**`computed get x() { }`** — Declares a private computed getter.',
    mount: '**`mount { }`** — Lifecycle hook. Runs after the component mounts to the DOM.',
    unmount: '**`unmount { }`** — Lifecycle hook. Runs before the component is removed from the DOM.',
    effect: '**`effect { }`** — Reactive effect. Re-runs when Signal dependencies change.',
    network: '**Capability: `network`** — Grants access to network APIs.',
    analytics: '**Capability: `analytics`** — Grants access to analytics tracking.',
    payment: '**Capability: `payment`** — Grants access to payment processing.',
  };

  const doc = HOVER_DOCS[word.word];
  if (!doc) return null;

  return {
    contents: [{ value: doc }],
  };
}
