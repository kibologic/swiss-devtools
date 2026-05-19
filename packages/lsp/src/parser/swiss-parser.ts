import { PATTERNS, type ComponentDeclaration, type LifecycleBlock } from '@swissjs/language-core/syntax';
import { LIFECYCLE_KEYWORDS } from '@swissjs/language-core/lifecycle';

export interface ParsedDocument {
  uri: string;
  text: string;
  components: ComponentDeclaration[];
  lifecycleBlocks: LifecycleBlock[];
  hasBareStyleTag: boolean;
  hasHtmlTemplate: boolean;
  hasCssTemplate: boolean;
  stateBlockLines: number[];
  reactiveVarLines: number[];
  requiresDecorators: { line: number; capabilities: string[] }[];
}

export function parseDocument(uri: string, text: string): ParsedDocument {
  const lines = text.split('\n');
  const components: ComponentDeclaration[] = [];
  const lifecycleBlocks: LifecycleBlock[] = [];
  const stateBlockLines: number[] = [];
  const reactiveVarLines: number[] = [];
  const requiresDecorators: { line: number; capabilities: string[] }[] = [];

  let hasBareStyleTag = false;
  let hasHtmlTemplate = false;
  let hasCssTemplate = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const lineNumber = i;

    // Component declaration
    const compMatch = PATTERNS.COMPONENT_DECL.exec(line);
    if (compMatch?.[1]) {
      components.push({ name: compMatch[1], line: lineNumber, column: line.indexOf('component') });
    }

    // Lifecycle hooks
    for (const keyword of LIFECYCLE_KEYWORDS) {
      const isAsync = /\basync\b/.test(line);
      if (new RegExp(`\\b${keyword}\\s*(\\(\\))?\\s*\\{`).test(line)) {
        lifecycleBlocks.push({
          kind: keyword as LifecycleBlock['kind'],
          isAsync,
          line: lineNumber,
        });
      }
    }

    // State block
    if (PATTERNS.STATE_BLOCK.test(line)) {
      stateBlockLines.push(lineNumber);
    }

    // Reactive variable
    if (PATTERNS.REACTIVE_VAR.test(line)) {
      reactiveVarLines.push(lineNumber);
    }

    // Bare style tag — rejected by compiler
    if (PATTERNS.BARE_STYLE_TAG.test(line)) {
      hasBareStyleTag = true;
    }

    // Template tags
    if (PATTERNS.HTML_TEMPLATE.test(line)) hasHtmlTemplate = true;
    if (PATTERNS.CSS_TEMPLATE.test(line)) hasCssTemplate = true;

    // @requires decorator — extract capability names
    const reqMatch = PATTERNS.REQUIRES_DECORATOR.exec(line);
    if (reqMatch) {
      const capMatches = [...line.matchAll(/'([^']+)'/g)];
      const capabilities = capMatches.map((m) => m[1]!);
      requiresDecorators.push({ line: lineNumber, capabilities });
    }
  }

  return {
    uri,
    text,
    components,
    lifecycleBlocks,
    hasBareStyleTag,
    hasHtmlTemplate,
    hasCssTemplate,
    stateBlockLines,
    reactiveVarLines,
    requiresDecorators,
  };
}

export function getLineAt(text: string, line: number): string {
  return text.split('\n')[line] ?? '';
}

export function getWordAtPosition(text: string, line: number, character: number): string {
  const lineText = getLineAt(text, line);
  const left = lineText.slice(0, character).match(/[a-zA-Z_$][\w$-]*$/)?.[0] ?? '';
  const right = lineText.slice(character).match(/^[\w$]*/)?.[0] ?? '';
  return left + right;
}

export function getContextAtPosition(text: string, line: number, character: number): 'decorator' | 'jsx-attr' | 'import' | 'general' {
  const lineText = getLineAt(text, line);
  const before = lineText.slice(0, character);
  if (/@\w*$/.test(before)) return 'decorator';
  if (/<\w+\s+[^>]*$/.test(before)) return 'jsx-attr';
  if (/from\s+['"]/.test(before) || /import\s+/.test(before)) return 'import';
  return 'general';
}
