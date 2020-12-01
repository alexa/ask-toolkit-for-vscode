import * as assert from 'assert';
import * as sinon from 'sinon';

import { DeploySkillWebview } from '../../../src/askContainer/webViews/deploySkillWebview';
import * as workspaceHelper from '../../../src/utils/workspaceHelper';
import { FakeExtensionContext, FakeWebviewPanelOnDidChangeViewStateEvent } from '../../testUtilities';
import * as exceptions from '../../../src/exceptions';
import * as helper from '../../../src/utils/deploySkillHelper';
import * as skillHelper from '../../../src/utils/skillHelper';

describe('Webview_deploySkill tests', () => {
    let webView: DeploySkillWebview;
    let sandbox: sinon.SinonSandbox;

    const fakeTitle = 'fakeTitle';
    const fakeID = 'fakeID';
    const fakeSkillPath = 'fakeSkillPath';

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('onViewChangeListener', () => {
        it('Should postMessage when visible', async () => {
            webView = new DeploySkillWebview(fakeTitle, fakeID, FakeExtensionContext.getFakeExtContext());

            const refreshSpy = sandbox.stub(webView, 'refresh' as any);
            const fakeEvent = FakeWebviewPanelOnDidChangeViewStateEvent.getFakeWebviewPanelOnDidChangeViewStateEvent();
            fakeEvent.webviewPanel.visible = true;

            await webView.onViewChangeListener(fakeEvent);

            assert.ok(refreshSpy.calledOnce);
        });

        it('Should not postMessage when not visible', async () => {
            webView = new DeploySkillWebview('fakeTitle', 'fakeID', FakeExtensionContext.getFakeExtContext());

            const refreshSpy = sandbox.stub(webView, 'refresh' as any);
            const fakeEvent = FakeWebviewPanelOnDidChangeViewStateEvent.getFakeWebviewPanelOnDidChangeViewStateEvent();
            fakeEvent.webviewPanel.visible = false;

            await webView.onViewChangeListener(fakeEvent);

            assert.ok(refreshSpy.notCalled);
        });
    });
    describe('onReceiveMessageListener', () => {
        const fakeExtensionContext = FakeExtensionContext.getFakeExtContext();
        before(() => {
            webView = new DeploySkillWebview(fakeTitle, fakeID, fakeExtensionContext);
        });
        it('Should call refresh when input message is refresh', async () => {
            const refreshSpy = sandbox.stub(webView, 'refresh' as any);
            const message = 'refresh';

            await webView.onReceiveMessageListener(message);

            assert.ok(refreshSpy.calledOnce);
        });

        it('When message is deploySkill, should throw error if getSkillFolder fail', async () => {
            const message = 'deploySkill';
            const fakeErrorMessage = 'fakeErrorMessage';
            sandbox.stub(workspaceHelper, 'getSkillFolderInWs').throws(new Error(fakeErrorMessage));
            const expectedError = exceptions.loggableAskError(`Skill deploy failed`, fakeErrorMessage, true);

            try {
                await webView.onReceiveMessageListener(message);
            } catch (e) {
                assert.deepStrictEqual(e, expectedError);

                return;
            }

            assert.fail('Should throw an error');
        });

        it('When message is deploySkill, be able to show deploy page and deploy skill', async () => {
            const message = 'deploySkill';
            const deploySpy = sandbox.stub(helper, 'deploySkill');
            const renderSpy = sandbox.stub(webView['loader'], 'renderView');
            sandbox.stub(workspaceHelper, 'getSkillFolderInWs').returns(fakeSkillPath);
            sandbox.stub(webView, 'getHtmlForView').returns('');
            // Call showView to instantiate panel
            webView.showView();

            await webView.onReceiveMessageListener(message);
            assert.ok(
                renderSpy.calledOnceWith({
                    name: 'deployInProgress',
                    errorMsg: 'Skill deployment in progress...',
                })
            );
            assert.ok(deploySpy.calledOnceWith(fakeSkillPath, fakeExtensionContext, webView));
        });

        it('When message is unknown, should throw unexpected message error', async () => {
            const message = 'invalidMessage';
            const expectedError = exceptions.loggableAskError('Unexpected message received from webview.');
            try {
                await webView.onReceiveMessageListener(message);
            } catch (e) {
                assert.deepStrictEqual(e, expectedError);

                return;
            }

            assert.fail('Should throw an error');
        });
    });

    describe('checkIfChangesExistFromUpstream', () => {
        before(() => {
            webView = new DeploySkillWebview(fakeTitle, fakeID, FakeExtensionContext.getFakeExtContext());
        });
        beforeEach(() => {
            sandbox.stub(workspaceHelper, 'getSkillFolderInWs').returns(fakeSkillPath);
        });

        it('Should return false when no changes from upstream', async () => {
            const fakeSkillRepo = {
                diffIndexWith() {
                    return [];
                },
            };
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            sandbox.stub(webView['gitApi']!, 'getRepository').returns(fakeSkillRepo);

            const result = await webView['checkIfChangesExistFromUpstream']();

            assert.strictEqual(result, false);
        });

        it('Should return true when changes exist', async () => {
            const fakeSkillRepo = {
                diffIndexWith() {
                    return ['changeOne'];
                },
            };
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            sandbox.stub(webView['gitApi']!, 'getRepository').returns(fakeSkillRepo);

            const result = await webView['checkIfChangesExistFromUpstream']();

            assert.strictEqual(result, true);
        });
    });

    describe('refresh', () => {
        beforeEach(() => {
            sandbox.stub(webView, 'getHtmlForView').returns('');
            // Call showView to instantiate panel
            webView.showView();
        });
        it('Should post {changeExist: true} when change exist', async () => {
            sandbox.stub(webView, 'checkIfChangesExistFromUpstream' as any).returns(true);
            const postMessageSpy = sandbox.stub(webView.getWebview(), 'postMessage');
            await webView['refresh']();

            assert.ok(postMessageSpy.calledOnceWith({ changesExist: true }));
        });

        it('Should post {changeExist: false} when change not exist', async () => {
            sandbox.stub(webView, 'checkIfChangesExistFromUpstream' as any).returns(false);
            const postMessageSpy = sandbox.stub(webView.getWebview(), 'postMessage');
            await webView['refresh']();

            assert.ok(postMessageSpy.calledOnceWith({ changesExist: false }));
        });
    });

    describe('getHtmlForView', () => {
        it('Should be able to return deploySkill view', () => {
            const fakeSkillDetails = {
                skillId: 'fakeSkillID',
                skillName: 'fakeSkillName',
            };
            const renderSpy = sandbox.stub(webView['loader'], 'renderView');
            sandbox.stub(skillHelper, 'getSkillDetailsFromWorkspace').returns(fakeSkillDetails);
            sandbox.stub(webView, 'checkIfChangesExistFromUpstream' as any).resolves(true);

            webView.getHtmlForView();

            assert.ok(
                renderSpy.calledOnceWith({
                    name: 'deploySkill',
                    js: true,
                    args: {
                        skillId: 'fakeSkillID',
                        skillName: 'fakeSkillName',
                    },
                })
            );
        });
    });
});
