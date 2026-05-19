import {
  type Diagnostic,
  DiagnosticSeverity,
  type Range,
} from 'vscode-languageserver/node.js';
import { BUILTIN_CAPABILITIES } from '@swissjs/language-core/capabilities';
import { type ParsedDocument } from '../parser/swiss-parser.js';

function range(startLine: number, startChar: number, endLine: number, endChar: number): Range {
  return {
    start: { line: startLine, character: startChar },
    end: { line: endLine, character: endChar },
  };
}

function lineRange(text: string, lineNumber: number): Range {
  const lines = text.split('\n');
  const lineText = lines[lineNumber] ?? '';
  return range(lineNumber, 0, lineNumber, lineText.length);
}

export function computeDiagnostics(doc: ParsedDocument): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const lines = doc.text.split('\n');

  // D-1: Bare <style> tag — compiler rejects these
  if (doc.hasBareStyleTag) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const match = /<style(?!\s*{)[^>]*>/.exec(line);
      if (match) {
        diagnostics.push({
          severity: DiagnosticSeverity.Error,
          range: range(i, match.index, i, match.index + match[0].length),
          message: 'Bare <style> tags are not supported in SwissJS. Use css`...` tagged template literals or <style>{`...`}</style>.',
          source: 'swissjs',
          code: 'SWISS_001',
        });
      }
    }
  }

  // D-2: component keyword without a valid PascalCase name
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const match = /\bcomponent\s+([a-z][A-Za-z0-9_]*)/.exec(line);
    if (match?.[1]) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: range(i, match.index, i, match.index + match[0].length),
        message: `Component name '${match[1]}' should start with an uppercase letter (PascalCase).`,
        source: 'swissjs',
        code: 'SWISS_002',
      });
    }
  }

  // D-3: component keyword with no name at all
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    if (/\bcomponent\s*\{/.test(line)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Error,
        range: lineRange(doc.text, i),
        message: 'Missing component name. Syntax: component <Name> { ... }',
        source: 'swissjs',
        code: 'SWISS_003',
      });
    }
  }

  // D-4: Unknown capability in @requires(...)
  for (const req of doc.requiresDecorators) {
    for (const cap of req.capabilities) {
      if (!(BUILTIN_CAPABILITIES as readonly string[]).includes(cap)) {
        const lineText = lines[req.line] ?? '';
        const capStart = lineText.indexOf(`'${cap}'`);
        diagnostics.push({
          severity: DiagnosticSeverity.Warning,
          range: range(req.line, capStart, req.line, capStart + cap.length + 2),
          message: `'${cap}' is not a recognized built-in capability. Ensure it is registered via registerDirectiveCapability(). Built-ins: ${BUILTIN_CAPABILITIES.join(', ')}.`,
          source: 'swissjs',
          code: 'SWISS_004',
        });
      }
    }
  }

  // D-5: Duplicate lifecycle hooks within same component scope
  const lifecycleKindCount: Record<string, number> = {};
  for (const block of doc.lifecycleBlocks) {
    lifecycleKindCount[block.kind] = (lifecycleKindCount[block.kind] ?? 0) + 1;
  }
  for (const block of doc.lifecycleBlocks) {
    if ((lifecycleKindCount[block.kind] ?? 0) > 1) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: lineRange(doc.text, block.line),
        message: `Duplicate '${block.kind}' lifecycle block. Only one ${block.kind} block per component is allowed.`,
        source: 'swissjs',
        code: 'SWISS_005',
      });
    }
  }

  // D-6: state block without any let declarations
  for (const stateLine of doc.stateBlockLines) {
    const blockContent = extractBlockContent(lines, stateLine);
    if (blockContent !== null && !/\blet\b/.test(blockContent)) {
      diagnostics.push({
        severity: DiagnosticSeverity.Warning,
        range: lineRange(doc.text, stateLine),
        message: 'Empty or invalid state block. Declare reactive fields with: state { let x: Type = value; }',
        source: 'swissjs',
        code: 'SWISS_006',
      });
    }
  }

  return diagnostics;
}

function extractBlockContent(lines: string[], startLine: number): string | null {
  let depth = 0;
  let content = '';
  let started = false;
  for (let i = startLine; i < Math.min(startLine + 50, lines.length); i++) {
    const line = lines[i] ?? '';
    for (const ch of line) {
      if (ch === '{') { depth++; started = true; }
      if (ch === '}') {
        depth--;
        if (started && depth === 0) return content;
      }
      if (started && depth > 0) content += ch;
    }
    if (started && depth > 0) content += '\n';
  }
  return null;
}
