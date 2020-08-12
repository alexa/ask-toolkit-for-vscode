'use stirct';

import * as assert from 'assert';
import * as vscode from 'vscode';

// package.json publisher + name. Test cannot access package.json, so hardcore here.
const extensionId = 'ask-toolkit.alexa-skills-kit-toolkit';

describe('Alexa Skill Kit Extension', () => {

	it('Extension should be present', () => {
		assert.ok(vscode.extensions.getExtension(extensionId));
	});

	it('should activate', async() => {
		const extension = vscode.extensions.getExtension(extensionId);
		if (extension) {
			await extension.activate();
			assert.ok(extension.isActive);
		} else {
			assert.fail('Extension is not available');
		}
	});
});
