/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { registerAudioPreviewSupport } from './audioPreview';
import { BinarySizeStatusBarEntry } from './binarySizeStatusBarEntry';
import { registerImagePreviewSupport } from './imagePreview';
import { MediaPreview } from './mediaPreview';
import { registerVideoPreviewSupport } from './videoPreview';

class GenericPreview extends MediaPreview {
	protected async getWebviewContents(): Promise<string> {
		const size = this.binarySize ? BinarySizeStatusBarEntry.formatSize(this.binarySize) : 'Unknown';
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';">
			</head>
			<body>
				<div style="padding: 20px; font-family: var(--vscode-font-family);">
					<h2>${this._resource.toString(true)}</h2>
					<p>File Size: ${size}</p>
				</div>
			</body>
			</html>`;
	}
}

// Track if we're currently showing a media preview
let isMediaPreviewActive = false;

// Create a single instance of the binary size status bar entry
const binarySizeStatusBarEntry = new BinarySizeStatusBarEntry();

// Function to update the status bar based on the active editor
async function updateStatusBar(editor: vscode.TextEditor | undefined) {
	// Hide first to clear any existing state
	binarySizeStatusBarEntry.hide(undefined);

	if (!editor) {
		return;
	}

	// Don't show size for media files that will be handled by their respective previews
	const uri = editor.document.uri;
	const isMediaFile = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg',
		'.mp3', '.wav', '.ogg', '.mp4', '.webm', '.mov']
		.some(ext => uri.fsPath.toLowerCase().endsWith(ext));

	if (isMediaFile) {
		return; // Media files will show their size in their preview
	}

	// For non-media files, show the size in the status bar
	try {
		const stat = await vscode.workspace.fs.stat(uri);
		binarySizeStatusBarEntry.show(editor, stat.size);
	} catch (e) {
		// Ignore errors
	}
}

export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(binarySizeStatusBarEntry);

	// Register media previews
	context.subscriptions.push(registerImagePreviewSupport(context, binarySizeStatusBarEntry));
	context.subscriptions.push(registerAudioPreviewSupport(context, binarySizeStatusBarEntry));
	context.subscriptions.push(registerVideoPreviewSupport(context, binarySizeStatusBarEntry));

	// Register generic file preview
	context.subscriptions.push(vscode.window.registerCustomEditorProvider(
		'mediaPreview.generic',
		{
			async openCustomDocument(uri: vscode.Uri) {
				return { uri, dispose: () => { } };
			},
			async resolveCustomEditor(document: vscode.CustomDocument, webviewPanel: vscode.WebviewPanel) {
				isMediaPreviewActive = true;
				new GenericPreview(context.extensionUri, document.uri, webviewPanel, binarySizeStatusBarEntry);
				webviewPanel.onDidDispose(() => {
					isMediaPreviewActive = false;
					updateStatusBar(vscode.window.activeTextEditor);
				});
			}
		},
		{ webviewOptions: { retainContextWhenHidden: true } }
	));

	// Register command to open any file with the generic preview
	context.subscriptions.push(vscode.commands.registerCommand('media-preview.openGenericPreview', (resource: vscode.Uri) => {
		const viewColumn = vscode.window.activeTextEditor?.viewColumn || vscode.ViewColumn.Active;
		vscode.commands.executeCommand('vscode.openWith', resource, 'mediaPreview.generic', viewColumn);
	}));

	// Update status bar when active editor changes
	context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		if (!isMediaPreviewActive) {
			updateStatusBar(editor);
		}
	}));

	// Initial update
	updateStatusBar(vscode.window.activeTextEditor);
}
