/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { registerAudioPreviewSupport } from './audioPreview';
import { BinarySizeStatusBarEntry } from './binarySizeStatusBarEntry';
import { FileSizeStatusBarEntry } from './fileSizeStatusBar';
import { FileSizeStatusBarContributor } from './fileSizeStatusBarContributor';
import { registerImagePreviewSupport } from './imagePreview';
import { registerVideoPreviewSupport } from './videoPreview';

export function activate(context: vscode.ExtensionContext) {
	const fileSizeStatusBarEntry = new FileSizeStatusBarEntry();
	const binarySizeStatusBarEntry = new BinarySizeStatusBarEntry();
	const fileSizeStatusBarContributor = new FileSizeStatusBarContributor(fileSizeStatusBarEntry);
	context.subscriptions.push(fileSizeStatusBarContributor);
	context.subscriptions.push(binarySizeStatusBarEntry);
	context.subscriptions.push(fileSizeStatusBarEntry);
	context.subscriptions.push(registerImagePreviewSupport(context, binarySizeStatusBarEntry));
	context.subscriptions.push(registerAudioPreviewSupport(context, binarySizeStatusBarEntry));
	context.subscriptions.push(registerVideoPreviewSupport(context, binarySizeStatusBarEntry));
}
