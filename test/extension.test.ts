'use stirct';

import * as assert from 'assert';
import * as vscode from 'vscode';

// package.json publisher + name. Test cannot access package.json, so hardcore here.
const extensionId = 'ask-toolkit.alexa-skills-kit-toolkit';

suite('Alexa Skill Kit Extension', () => {

	test('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension(extensionId));
	});

	test('should activate', function () {
		this.timeout(20 * 1000);
		return vscode.extensions.getExtension(extensionId)!.activate().then(() => {
			assert.ok(true);
		});
	});
});
