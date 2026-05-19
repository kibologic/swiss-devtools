#!/usr/bin/env node
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  type InitializeParams,
  type InitializeResult,
  TextDocumentSyncKind,
  CompletionItemKind,
  SemanticTokensLegend,
} from 'vscode-languageserver/node.js';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parseDocument } from '../parser/swiss-parser.js';
import { computeDiagnostics } from '../diagnostics/index.js';
import { computeCompletions } from '../completions/index.js';
import { computeHover } from '../hover/index.js';
import { computeSemanticTokens, TOKEN_TYPES, TOKEN_MODIFIERS } from '../semantic-tokens/index.js';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

const legend: SemanticTokensLegend = {
  tokenTypes: [...TOKEN_TYPES],
  tokenModifiers: [...TOKEN_MODIFIERS],
};

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['@', '.', '<', ' ', '"', "'"],
      },
      hoverProvider: true,
      semanticTokensProvider: {
        legend,
        full: true,
        range: false,
      },
      documentFormattingProvider: false, // TODO: blocked pending formatter implementation
    },
    serverInfo: {
      name: 'swissjs-language-server',
      version: '0.1.0',
    },
  };
});

connection.onInitialized(() => {
  connection.console.log('SwissJS Language Server initialized');
});

// Re-validate on every change
documents.onDidChangeContent((change) => {
  validateDocument(change.document);
});

documents.onDidOpen((event) => {
  validateDocument(event.document);
});

function validateDocument(document: TextDocument): void {
  const text = document.getText();
  const parsed = parseDocument(document.uri, text);
  const diagnostics = computeDiagnostics(parsed);
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

connection.onCompletion((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return [];

  const text = document.getText();
  const { line, character } = params.position;

  return computeCompletions(text, line, character);
});

connection.onHover((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return null;

  const text = document.getText();
  return computeHover(text, params.position);
});

connection.languages.semanticTokens.on((params) => {
  const document = documents.get(params.textDocument.uri);
  if (!document) return { data: [] };
  return computeSemanticTokens(document.getText());
});

documents.listen(connection);
connection.listen();
