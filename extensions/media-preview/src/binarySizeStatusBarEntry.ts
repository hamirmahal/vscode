/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { PreviewStatusBarEntry } from './ownedStatusBarEntry';


export class BinarySizeStatusBarEntry extends PreviewStatusBarEntry {
	private static readonly KB = 1024;
	private static readonly MB = BinarySizeStatusBarEntry.KB * BinarySizeStatusBarEntry.KB;
	private static readonly GB = BinarySizeStatusBarEntry.MB * BinarySizeStatusBarEntry.KB;
	private static readonly TB = BinarySizeStatusBarEntry.GB * BinarySizeStatusBarEntry.KB;

	public static formatSize(size: number): string {
		if (size < BinarySizeStatusBarEntry.KB) {
			return vscode.l10n.t("{0}B", size);
		}

		if (size < BinarySizeStatusBarEntry.MB) {
			return vscode.l10n.t("{0}KB", (size / BinarySizeStatusBarEntry.KB).toFixed(2));
		}

		if (size < BinarySizeStatusBarEntry.GB) {
			return vscode.l10n.t("{0}MB", (size / BinarySizeStatusBarEntry.MB).toFixed(2));
		}

		if (size < BinarySizeStatusBarEntry.TB) {
			return vscode.l10n.t("{0}GB", (size / BinarySizeStatusBarEntry.GB).toFixed(2));
		}

		return vscode.l10n.t("{0}TB", (size / BinarySizeStatusBarEntry.TB).toFixed(2));
	}

	constructor() {
		super('status.imagePreview.binarySize', vscode.l10n.t("Image Binary Size"), vscode.StatusBarAlignment.Right, 100);
	}

	private sizeCache = new Map<string, number>();

	public async show(owner: unknown, resource: vscode.Uri | number) {
		if (typeof resource === 'number') {
			super.showItem(owner, BinarySizeStatusBarEntry.formatSize(resource));
			return;
		}

		try {
			const uriString = resource.toString();
			let size = this.sizeCache.get(uriString);
			if (size === undefined) {
				const stat = await vscode.workspace.fs.stat(resource);
				size = stat.size;
				this.sizeCache.set(uriString, size);
			}

			super.showItem(owner, BinarySizeStatusBarEntry.formatSize(size));
		} catch (e) {
			this.hide(owner);
		}
	}

	public override hide(owner: unknown): void {
		this.sizeCache.clear();
		super.hide(owner);
	}
}
