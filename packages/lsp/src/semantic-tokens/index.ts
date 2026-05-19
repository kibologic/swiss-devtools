import type { SemanticTokens } from 'vscode-languageserver/node.js';
import { PATTERNS } from '@swissjs/language-core/syntax';

// Token types exposed to the client (index corresponds to position in legend)
export const TOKEN_TYPES = [
  'keyword',      // 0 — Swiss keywords: component, state, reactive, etc.
  'class',        // 1 — Component names
  'function',     // 2 — Lifecycle hooks, computed getters
  'variable',     // 3 — Reactive variables, state fields
  'decorator',    // 4 — @requires, @capability
  'type',         // 5 — Capability names, type annotations
] as const;

export const TOKEN_MODIFIERS = [
  'declaration',
  'definition',
  'async',
] as const;

interface RawToken {
  line: number;
  startChar: number;
  length: number;
  tokenType: number;
  tokenModifiers: number;
}

// TODO: blocked pending Tree-sitter AST integration.
// The current implementation uses regex heuristics derived from the
// compiler transformer patterns. It will be replaced with a Tree-sitter
// query-based approach once tree-sitter-swissjs grammar is implemented.
export function computeSemanticTokens(text: string): SemanticTokens {
  const lines = text.split('\n');
  const rawTokens: RawToken[] = [];

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx] ?? '';

    // component <Name>
    const compMatch = /\b(component)\s+([A-Z][A-Za-z0-9_]*)/.exec(line);
    if (compMatch) {
      rawTokens.push({
        line: lineIdx,
        startChar: compMatch.index,
        length: compMatch[1]!.length,
        tokenType: 0, // keyword
        tokenModifiers: 0,
      });
      rawTokens.push({
        line: lineIdx,
        startChar: compMatch.index + compMatch[1]!.length + 1,
        length: compMatch[2]!.length,
        tokenType: 1, // class
        tokenModifiers: 1 << 0, // declaration
      });
    }

    // state keyword
    const stateMatch = /\b(state)\s*\{/.exec(line);
    if (stateMatch) {
      rawTokens.push({ line: lineIdx, startChar: stateMatch.index, length: 5, tokenType: 0, tokenModifiers: 0 });
    }

    // reactive <name>
    const reactiveMatch = PATTERNS.REACTIVE_VAR.exec(line);
    if (reactiveMatch) {
      const reactiveStart = line.indexOf('reactive');
      rawTokens.push({ line: lineIdx, startChar: reactiveStart, length: 8, tokenType: 0, tokenModifiers: 0 });
      if (reactiveMatch[1]) {
        const varStart = line.indexOf(reactiveMatch[1], reactiveStart + 8);
        rawTokens.push({ line: lineIdx, startChar: varStart, length: reactiveMatch[1].length, tokenType: 3, tokenModifiers: 1 << 1 });
      }
    }

    // computed get <name>
    const computedMatch = PATTERNS.COMPUTED_PROP.exec(line);
    if (computedMatch) {
      const computedStart = line.indexOf('computed');
      rawTokens.push({ line: lineIdx, startChar: computedStart, length: 8, tokenType: 0, tokenModifiers: 0 });
      if (computedMatch[1]) {
        const fnStart = line.indexOf(computedMatch[1], computedStart);
        rawTokens.push({ line: lineIdx, startChar: fnStart, length: computedMatch[1].length, tokenType: 2, tokenModifiers: 1 << 1 });
      }
    }

    // @requires
    if (PATTERNS.REQUIRES_DECORATOR.test(line)) {
      const atIdx = line.indexOf('@requires');
      rawTokens.push({ line: lineIdx, startChar: atIdx, length: '@requires'.length, tokenType: 4, tokenModifiers: 0 });
    }

    // mount / unmount / effect
    for (const keyword of ['mount', 'unmount', 'effect']) {
      const kwMatch = new RegExp(`\\b(async\\s+)?(${keyword})\\b`).exec(line);
      if (kwMatch?.[2]) {
        const isAsync = !!kwMatch[1];
        const kwStart = kwMatch[1] ? line.indexOf(kwMatch[1]) : line.indexOf(keyword);
        rawTokens.push({
          line: lineIdx,
          startChar: isAsync ? kwStart + kwMatch[1]!.length : kwStart,
          length: keyword.length,
          tokenType: 2,
          tokenModifiers: isAsync ? (1 << 2) : 0,
        });
      }
    }
  }

  // Sort tokens by line then startChar
  rawTokens.sort((a, b) => a.line - b.line || a.startChar - b.startChar);

  // Encode as relative deltas (LSP semantic tokens protocol)
  const data: number[] = [];
  let prevLine = 0;
  let prevChar = 0;

  for (const tok of rawTokens) {
    const deltaLine = tok.line - prevLine;
    const deltaChar = deltaLine === 0 ? tok.startChar - prevChar : tok.startChar;
    data.push(deltaLine, deltaChar, tok.length, tok.tokenType, tok.tokenModifiers);
    prevLine = tok.line;
    prevChar = tok.startChar;
  }

  return { data };
}
