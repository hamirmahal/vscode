/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { SizeStatusBarEntry } from './sizeStatusBarEntry';
export class FileSizeStatusBarEntry extends SizeStatusBarEntry {

	constructor() {
		super('status.fileSize', vscode.l10n.t("File Size"), vscode.StatusBarAlignment.Right, 98);
	}
}
