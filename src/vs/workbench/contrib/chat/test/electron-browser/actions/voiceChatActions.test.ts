/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../../../base/test/common/utils.js';
import { applyDictationInputState, parseNextChatResponseChunk } from '../../../electron-browser/actions/voiceChatActions.js';
import { SpeechToTextStatus } from '../../../../speech/common/speechService.js';

suite('VoiceChatActions', function () {

	function assertChunk(text: string, expected: string | undefined, offset: number): { chunk: string | undefined; offset: number } {
		const res = parseNextChatResponseChunk(text, offset);
		assert.strictEqual(res.chunk, expected);

		return res;
	}

	test('parseNextChatResponseChunk', function () {

		// Simple, no offset
		assertChunk('Hello World', undefined, 0);
		assertChunk('Hello World.', undefined, 0);
		assertChunk('Hello World. ', 'Hello World.', 0);
		assertChunk('Hello World? ', 'Hello World?', 0);
		assertChunk('Hello World! ', 'Hello World!', 0);
		assertChunk('Hello World: ', 'Hello World:', 0);

		// Ensure chunks are parsed from the end, no offset
		assertChunk('Hello World. How is your day? And more...', 'Hello World. How is your day?', 0);

		// Ensure chunks are parsed from the end, with offset
		let offset = assertChunk('Hello World. How is your ', 'Hello World.', 0).offset;
		offset = assertChunk('Hello World. How is your day? And more...', 'How is your day?', offset).offset;
		offset = assertChunk('Hello World. How is your day? And more to come! ', 'And more to come!', offset).offset;
		assertChunk('Hello World. How is your day? And more to come! ', undefined, offset);

		// Sparted by newlines
		offset = assertChunk('Hello World.\nHow is your', 'Hello World.', 0).offset;
		assertChunk('Hello World.\nHow is your day?\n', 'How is your day?', offset);
	});

	test('applyDictationInputState treats Recognizing as preview replacement', function () {
		let state = {
			committedInput: '',
			previewInput: ''
		};

		state = applyDictationInputState(state, '', 'I', SpeechToTextStatus.Recognizing);
		assert.deepStrictEqual(state, {
			committedInput: '',
			previewInput: 'I'
		});

		state = applyDictationInputState(state, 'I', 'I just', SpeechToTextStatus.Recognizing);
		assert.deepStrictEqual(state, {
			committedInput: '',
			previewInput: 'I just'
		});

		state = applyDictationInputState(state, 'I just', 'I just deleted all text', SpeechToTextStatus.Recognized);
		assert.deepStrictEqual(state, {
			committedInput: 'I just deleted all text',
			previewInput: 'I just deleted all text'
		});
	});

	test('applyDictationInputState rebases on manual user edits', function () {
		let state = {
			committedInput: 'typed text',
			previewInput: 'typed text'
		};

		state = applyDictationInputState(state, 'typed text', 'hello', SpeechToTextStatus.Recognized);
		assert.deepStrictEqual(state, {
			committedInput: 'typed text hello',
			previewInput: 'typed text hello'
		});

		state = applyDictationInputState(state, '', 'second phrase', SpeechToTextStatus.Recognizing);
		assert.deepStrictEqual(state, {
			committedInput: '',
			previewInput: 'second phrase'
		});

		state = applyDictationInputState(state, 'second phrase', 'second phrase done', SpeechToTextStatus.Recognized);
		assert.deepStrictEqual(state, {
			committedInput: 'second phrase done',
			previewInput: 'second phrase done'
		});
	});

	ensureNoDisposablesAreLeakedInTestSuite();
});
