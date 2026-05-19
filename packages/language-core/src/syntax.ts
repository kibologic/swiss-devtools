export const SWISS_KEYWORDS = [
  'component',
  'state',
  'reactive',
  'computed',
  'mount',
  'unmount',
  'effect',
  'props',
] as const;

export type SwissKeyword = (typeof SWISS_KEYWORDS)[number];

export const SWISS_MODIFIERS = ['async', 'export'] as const;

export const SWISS_TEMPLATE_TAGS = ['html', 'css'] as const;

// Patterns derived from compiler/src/transformers/swiss-syntax.ts
export const PATTERNS = {
  // component Foo { ... }
  COMPONENT_DECL: /\bcomponent\s+([A-Z][A-Za-z0-9_]*)\s*\{/,

  // state { let x: T = v; }
  STATE_BLOCK: /\bstate\s*\{/,

  // reactive let x: T = v;
  REACTIVE_VAR: /\breactive\s+let\s+(\w+)/,

  // computed get x() { ... }
  COMPUTED_PROP: /\bcomputed\s+get\s+(\w+)\s*\(\)/,

  // mount { ... }  |  mount() { ... }  |  async mount() { ... }
  MOUNT_HOOK: /\b(async\s+)?mount\s*(\(\))?\s*\{/,

  // unmount { ... }  |  unmount() { ... }
  UNMOUNT_HOOK: /\b(async\s+)?unmount\s*(\(\))?\s*\{/,

  // effect { ... }
  EFFECT_BLOCK: /\beffect\s*\{/,

  // props = { label: string }
  PROPS_DECL: /\bprops\s*=/,

  // export let x: T;   (component prop)
  EXPORT_PROP: /^export\s+let\s+(\w+)/m,

  // @requires('cap1', 'cap2')
  REQUIRES_DECORATOR: /@requires\s*\(/,

  // @capability(...)
  CAPABILITY_DECORATOR: /@capability\s*\(/,

  // bare <style> (rejected by compiler)
  BARE_STYLE_TAG: /<style(?!\s*{)[^>]*>/,

  // html`...`
  HTML_TEMPLATE: /\bhtml\s*`/,

  // css`...`
  CSS_TEMPLATE: /\bcss\s*`/,
} as const;

export interface ComponentDeclaration {
  name: string;
  line: number;
  column: number;
}

export interface StateBlock {
  line: number;
  fields: StateField[];
}

export interface StateField {
  name: string;
  type: string;
  initializer: string;
}

export interface LifecycleBlock {
  kind: 'mount' | 'unmount' | 'effect';
  isAsync: boolean;
  line: number;
}
