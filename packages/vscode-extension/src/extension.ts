import * as path from 'node:path';
import type { ExtensionContext } from 'vscode';
import { workspace, window, commands } from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node.js';

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration('swissjs');
  const lspEnabled = config.get<boolean>('lsp.enabled', true);

  if (!lspEnabled) {
    return;
  }

  const serverModule = context.asAbsolutePath(
    path.join('node_modules', '@swissjs', 'lsp', 'dist', 'server', 'index.js'),
  );

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'swissjs' },
      { scheme: 'untitled', language: 'swissjs' },
    ],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.{ui,uix}'),
    },
    traceOutputChannel: window.createOutputChannel('SwissJS Language Server Trace'),
  };

  client = new LanguageClient(
    'swissjs',
    'SwissJS Language Server',
    serverOptions,
    clientOptions,
  );

  await client.start();

  context.subscriptions.push(
    commands.registerCommand('swissjs.restartServer', async () => {
      await client?.stop();
      await client?.start();
      window.showInformationMessage('SwissJS Language Server restarted.');
    }),
  );

  context.subscriptions.push({
    dispose: () => client?.stop(),
  });
}

export async function deactivate(): Promise<void> {
  await client?.stop();
}
