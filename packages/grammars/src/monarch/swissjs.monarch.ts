import type * as Monaco from 'monaco-editor';

// Monarch tokenizer for SwissJS (.ui / .uix) in Monaco Editor.
// Derived from compiler/src/transformers/swiss-syntax.ts semantics.
export const swissjsMonarch: Monaco.languages.IMonarchLanguage = {
  keywords: [
    'component', 'state', 'reactive', 'computed',
    'mount', 'unmount', 'effect', 'props',
  ],

  typeKeywords: [
    'boolean', 'double', 'byte', 'int', 'short', 'char', 'void', 'long', 'float',
    'number', 'string', 'any', 'never', 'unknown', 'null', 'undefined',
  ],

  operators: [
    '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
    '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
    '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
    '%=', '<<=', '>>=', '>>>=',
  ],

  capabilities: ['network', 'analytics', 'payment'],

  decorators: [
    'requires', 'capability', 'property', 'state', 'query', 'queryAll', 'event', 'provide', 'inject',
  ],

  directives: ['v-if', 'v-for', 'v-bind', '*if', '*for', '*bind'],

  templateTags: ['html', 'css'],

  symbols: /[=><!~?:&|+\-*/^%]+/,
  escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

  tokenizer: {
    root: [
      // Component declaration
      [/\bcomponent\b/, { token: 'keyword.control.component', next: '@component_name' }],

      // State block opener
      [/\bstate\b(?=\s*\{)/, 'keyword.control.state'],

      // Lifecycle hooks
      [/\b(async\s+)?(mount|unmount|effect)\b/, 'keyword.control.lifecycle'],

      // Reactive variable
      [/\breactive\b(?=\s+let)/, 'keyword.control.reactive'],

      // Computed property
      [/\bcomputed\b(?=\s+get)/, 'keyword.control.computed'],

      // Props
      [/\bprops\b(?=\s*=)/, 'keyword.operator.props'],

      // Decorators
      [/@(requires)/, { token: 'support.function.decorator.requires', next: '@requires_args' }],
      [/@([a-zA-Z_]\w*)/, {
        cases: {
          '@decorators': 'support.function.decorator',
          '@default': 'identifier',
        },
      }],

      // Tagged template literals
      [/\bhtml\b(?=\s*`)/, { token: 'support.function.tag.html', next: '@html_template' }],
      [/\bcss\b(?=\s*`)/, { token: 'support.function.tag.css', next: '@css_template' }],

      // Directives in JSX attributes
      [/v-if|v-for|v-bind|\*if|\*for|\*bind/, 'support.type.directive'],

      // Whitespace
      { include: '@whitespace' },

      // Identifiers and keywords
      [/[a-zA-Z_$][\w$]*/, {
        cases: {
          '@keywords': 'keyword.control',
          '@typeKeywords': 'keyword.type',
          '@default': 'identifier',
        },
      }],

      // Numbers
      [/\d*\.\d+([eE][-+]?\d+)?/, 'number.float'],
      [/0[xX][0-9a-fA-F]+/, 'number.hex'],
      [/\d+/, 'number'],

      // Strings
      [/"([^"\\]|\\.)*$/, 'string.invalid'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string_double' }],
      [/'([^'\\]|\\.)*$/, 'string.invalid'],
      [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

      // Delimiters
      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, {
        cases: {
          '@operators': 'operator',
          '@default': '',
        },
      }],

      // Delimiter
      [/[;,.]/, 'delimiter'],
    ],

    component_name: [
      [/[A-Z][A-Za-z0-9_]*/, { token: 'entity.name.type.class.component', next: '@pop' }],
      [/\s+/, 'white'],
    ],

    requires_args: [
      [/\(/, 'punctuation'],
      [/'(network|analytics|payment)'/, 'support.type.capability'],
      [/'[^']*'/, 'string'],
      [/"(network|analytics|payment)"/, 'support.type.capability'],
      [/"[^"]*"/, 'string'],
      [/,/, 'delimiter'],
      [/\s+/, 'white'],
      [/\)/, { token: 'punctuation', next: '@pop' }],
    ],

    html_template: [
      [/`/, { token: 'punctuation.template.end', next: '@pop' }],
      [/\$\{/, { token: 'punctuation.template-expression.begin', next: '@template_expr' }],
      [/v-if|v-for|v-bind|\*if|\*for|\*bind/, 'support.type.directive'],
      [/<\/?\w+/, 'tag'],
      [/=/, 'operator'],
      [/"[^"]*"/, 'attribute.value'],
      [/[^`$<]+/, 'meta.embedded.html'],
    ],

    css_template: [
      [/`/, { token: 'punctuation.template.end', next: '@pop' }],
      [/\$\{/, { token: 'punctuation.template-expression.begin', next: '@template_expr' }],
      [/[^`$]+/, 'meta.embedded.css'],
    ],

    template_expr: [
      [/\}/, { token: 'punctuation.template-expression.end', next: '@pop' }],
      { include: '@root' },
    ],

    whitespace: [
      [/[ \t\r\n]+/, 'white'],
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment_block'],
    ],

    comment_block: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],

    string_double: [
      [/[^\\"]+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],

    string_single: [
      [/[^\\']+/, 'string'],
      [/@escapes/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],
  },
};

export const SWISS_LANGUAGE_CONFIG: Monaco.languages.LanguageConfiguration = {
  comments: {
    lineComment: '//',
    blockComment: ['/*', '*/'],
  },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"', notIn: ['string', 'comment'] },
    { open: "'", close: "'", notIn: ['string', 'comment'] },
    { open: '`', close: '`', notIn: ['string', 'comment'] },
    { open: '<', close: '>', notIn: ['string', 'comment'] },
  ],
  surroundingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: '`' },
    { open: '<', close: '>' },
  ],
  folding: {
    markers: {
      start: new RegExp('^\\s*//\\s*#region\\b'),
      end: new RegExp('^\\s*//\\s*#endregion\\b'),
    },
  },
  wordPattern: /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}\\|;:'",.<>/?/\s]+)/,
  indentationRules: {
    increaseIndentPattern: new RegExp('^((?!.*?\\/\\*.*\\*\\/).)*[^\\s{])).*\\{\\s*$'),
    decreaseIndentPattern: new RegExp('^(.*\\*\\/)?\\s*\\}'),
  },
};
