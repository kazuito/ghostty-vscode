import * as path from "node:path";
import type { ExtensionContext } from "vscode";
import {
	LanguageClient,
	type LanguageClientOptions,
	type ServerOptions,
	TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	const serverModule = context.asAbsolutePath(
		path.join("out", "server", "server.js"),
	);

	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: { module: serverModule, transport: TransportKind.ipc },
	};

	const clientOptions: LanguageClientOptions = {
		documentSelector: [{ language: "ghostty-config" }],
	};

	client = new LanguageClient(
		"ghosttyLsp",
		"Ghostty Language Server",
		serverOptions,
		clientOptions,
	);

	client.start();
	context.subscriptions.push(client);
}

export function deactivate(): Thenable<void> | undefined {
	return client?.stop();
}
