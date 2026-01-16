/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { FileSizeStatusBarEntry } from './fileSizeStatusBar';
import { Disposable } from './util/dispose';
export class FileSizeStatusBarContributor extends Disposable {
	private readonly fileSizeStatusBarEntry: FileSizeStatusBarEntry;
	private activeEditor: vscode.TextEditor | undefined;
	constructor(fileSizeStatusBarEntry: FileSizeStatusBarEntry) {
		super();
		this.fileSizeStatusBarEntry = fileSizeStatusBarEntry;
		this._register(vscode.window.onDidChangeActiveTextEditor(editor => {
			this.onActiveEditorChanged(editor);
		}));

		// Listen for document saves to update file size.
		this._register(vscode.workspace.onDidSaveTextDocument(document => {
			if (this.activeEditor?.document === document) {
				this.updateFileSize();
			}
		}));

		// Update initially.
		this.onActiveEditorChanged(vscode.window.activeTextEditor);
	}

	private onActiveEditorChanged(editor: vscode.TextEditor | undefined): void {
		this.activeEditor = editor;
		this.updateFileSize();
	}

	private async updateFileSize(): Promise<void> {
		if (!this.activeEditor?.document.uri) {
			this.fileSizeStatusBarEntry.hide(this);
			return;
		}

		const uri = this.activeEditor.document.uri;

		if (uri.scheme === 'untitled' || uri.scheme === 'output' || uri.scheme === 'debug') {
			this.fileSizeStatusBarEntry.hide(this);
			return;
		}

		try {
			// Get file stats.
			const stats = await vscode.workspace.fs.stat(uri);
			this.fileSizeStatusBarEntry.show(this, stats.size);
		} catch (error) {
			// File might not exist or be accessible - log and hide status bar.
			console.debug('Failed to get file stats for file size status bar:', error);
			this.fileSizeStatusBarEntry.hide(this);
		}
	}
}
