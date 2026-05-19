# Tree-sitter SwissJS Grammar — Roadmap

> Status: **PLANNED** — not started. Do not build until compiler parser is formalized.

## Why Tree-sitter

Tree-sitter is mandatory long-term infrastructure for SwissJS tooling:

| Capability | Unlocked by |
|---|---|
| Semantic tokens (LSP) | Tree-sitter queries |
| Incremental parsing | Tree-sitter built-in |
| Error recovery | Tree-sitter built-in |
| Neovim support | `nvim-treesitter` |
| Helix support | native |
| Zed support | native |
| High-quality AI context | Tree-sitter parse tree |
| Advanced LSP go-to-definition | AST traversal |

## Blocker

The SwissJS compiler at `@swissjs/compiler` uses **lexical (regex) transformation**, not a proper AST parser. Tree-sitter requires a formal grammar spec.

**Before tree-sitter work begins:**
1. Formalize the SwissJS language grammar as a PEG or CFG
2. Document all node kinds with test fixtures
3. Build `grammar.js` from the formal spec
4. Replace regex transforms in `@swissjs/compiler` with Tree-sitter parse results

## Planned structure

```
tree-sitter/
├── grammar.js          # Tree-sitter grammar definition
├── queries/
│   ├── highlights.scm  # Syntax highlighting queries
│   ├── locals.scm      # Local variable scopes
│   ├── folds.scm       # Code folding
│   └── injections.scm  # CSS + TS embedded language injection
├── bindings/
│   ├── node/           # Node.js bindings
│   └── wasm/           # WASM bindings (for browser use)
└── corpus/
    ├── component.txt    # Test fixtures: component declarations
    ├── state.txt        # Test fixtures: state blocks
    ├── lifecycle.txt    # Test fixtures: lifecycle hooks
    ├── reactive.txt     # Test fixtures: reactive vars
    └── expressions.txt  # Test fixtures: template expressions
```

## Required grammar nodes

Based on compiler transform analysis (`compiler/src/transformers/swiss-syntax.ts`):

```
component_declaration
  name: identifier (PascalCase)
  body: class_body

state_block
  field: state_field*

state_field
  name: identifier
  type: type_annotation
  initializer: expression

reactive_declaration
  name: identifier
  type: type_annotation
  initializer: expression?

computed_declaration
  name: identifier
  body: block

lifecycle_block
  kind: "mount" | "unmount" | "effect"
  is_async: bool
  body: block

props_declaration
  fields: prop_field*

capability_decorator
  capabilities: string_literal+

html_template
  content: embedded_html

css_template
  content: embedded_css

expression_interpolation
  expression: expression
```

## Queries to implement

### highlights.scm (partial spec)

```scheme
; Component declaration
(component_declaration
  name: (identifier) @type.definition)

; Swiss keywords
"component" @keyword
"state" @keyword
"reactive" @keyword
"computed" @keyword
"mount" @keyword.control
"unmount" @keyword.control
"effect" @keyword.control

; State fields
(state_field name: (identifier) @variable.member)

; Reactive vars
(reactive_declaration name: (identifier) @variable)

; @requires decorator
(capability_decorator) @attribute

; Capability strings
(capability_decorator (string_literal) @constant.builtin)

; html/css template tags
"html" @function.builtin
"css" @function.builtin
```

### injections.scm

```scheme
; Inject HTML parsing into html`...` template literals
((html_template) @injection.content
  (#set! injection.language "html"))

; Inject CSS parsing into css`...` template literals
((css_template) @injection.content
  (#set! injection.language "css"))

; Inject TypeScript into expression interpolations
((expression_interpolation) @injection.content
  (#set! injection.language "typescript"))
```

## Implementation sequence

1. Define formal grammar (PEG notation alongside `grammar.js`)
2. Build corpus tests for all Swiss constructs
3. Implement `grammar.js` passing corpus tests
4. Add `highlights.scm` and `injections.scm`
5. Build Node.js + WASM bindings
6. Submit to `nvim-treesitter` parser list
7. Update `@swissjs/lsp` semantic tokens to use Tree-sitter
8. Deprecate regex-based semantic token implementation
