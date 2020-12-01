import * as vscode from 'vscode';
import * as assert from 'assert';
import * as sinon from 'sinon';

import { HelpViewProvider } from '../../../../src/askContainer/treeViews/treeViewProviders/helpViewProvider';
import { HelpView } from '../../../../src/askContainer/treeViews/helpView';
import { ext } from '../../../../src/extensionGlobals';
import { PluginTreeItem, CustomResource, ContextValueTypes, Resource } from '../../../../src/runtime/';
import { HELP_VIEW_ITEMS, EXTERNAL_LINKS } from '../../../../src/constants';

describe('TreeView_helpViewProvider tests', () => {
    let helpView: HelpView;
    let helpViewProvider: HelpViewProvider;
    let sandbox: sinon.SinonSandbox;
    before(() => {
        helpView = new HelpView(ext.context);
        helpViewProvider = new HelpViewProvider(helpView);
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getChildren tests', () => {
        it('Should add root resources when no element', () => {
            const expectedGettingStarted = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED,
                null,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                undefined,
                ContextValueTypes.SKILL
            );
            const expectedWhatsNew = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.WHATS_NEW,
                null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'welcome',
                    command: 'ask.welcome',
                },
                undefined,
                ContextValueTypes.SKILL
            );

            const [gettingStarted, whatsNew, ...others] = helpViewProvider.getChildren();

            assert.deepStrictEqual(gettingStarted, expectedGettingStarted);
            assert.deepStrictEqual(whatsNew, expectedWhatsNew);
            assert.ok(others.length === 0);
        });

        it('should add getting started resources when element label is getting started', () => {
            const fakeElement = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED,
                null,
                vscode.TreeItemCollapsibleState.None
            );
            const expectedSdkResources = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_SDK,
                null,
                vscode.TreeItemCollapsibleState.Collapsed,
                undefined,
                undefined,
                ContextValueTypes.SKILL
            );
            const expectedAskCli = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_CLI,
                null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'openUrl',
                    command: 'ask.container.openUrl',
                    arguments: [EXTERNAL_LINKS.TOOLS_DOCS.CLI, true, { CommandType: 'TOOLS_DOCS_CLI' }],
                },
                undefined,
                ContextValueTypes.SKILL
            );
            const expectedAskPlugin = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_VSCODE,
                null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'openUrl',
                    command: 'ask.container.openUrl',
                    arguments: [EXTERNAL_LINKS.TOOLS_DOCS.VSCODE, true, { CommandType: 'TOOLS_DOCS_VSCODE' }],
                },
                undefined,
                ContextValueTypes.SKILL
            );

            const [sdkResources, askCli, askPlugin, ...others] = helpViewProvider.getChildren(fakeElement);

            assert.deepStrictEqual(sdkResources, expectedSdkResources);
            assert.deepStrictEqual(askCli, expectedAskCli);
            assert.deepStrictEqual(askPlugin, expectedAskPlugin);
            assert.ok(others.length === 0);
        });

        it('should add SDK resources when element label is sdk resources', () => {
            const fakeElement = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_SDK,
                null,
                vscode.TreeItemCollapsibleState.None
            );
            const expectedCustomSkills = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_ASK_SDK,
                null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'openUrl',
                    command: 'ask.container.openUrl',
                    arguments: [EXTERNAL_LINKS.TOOLS_DOCS.ASK_SDK, true, { CommandType: 'TOOLS_DOCS_ASK_SDK' }],
                },
                undefined,
                ContextValueTypes.SKILL
            );
            const expectedSmapi = new PluginTreeItem<CustomResource>(
                HELP_VIEW_ITEMS.GETTING_STARTED_SMAPI_SDK,
                null,
                vscode.TreeItemCollapsibleState.None,
                {
                    title: 'openUrl',
                    command: 'ask.container.openUrl',
                    arguments: [EXTERNAL_LINKS.TOOLS_DOCS.SMAPI_SDK, true, { CommandType: 'TOOLS_DOCS_SMAPI_SDK' }],
                },
                undefined,
                ContextValueTypes.SKILL
            );

            const [customSkills, smapi, ...others] = helpViewProvider.getChildren(fakeElement);

            assert.deepStrictEqual(customSkills, expectedCustomSkills);
            assert.deepStrictEqual(smapi, expectedSmapi);
            assert.ok(others.length === 0);
        });

        it('should return empty array when element is unknown', () => {
            const fakeElement = new PluginTreeItem<CustomResource>(
                'unknown label',
                null,
                vscode.TreeItemCollapsibleState.None
            );

            const expectedResult = helpViewProvider.getChildren(fakeElement);

            assert.deepStrictEqual(expectedResult, []);
        });
    });

    describe('getTreeItem', () => {
        it('getTreeItem should return the same input treeItem', () => {
            const fakeElement = new PluginTreeItem<Resource>('fakeLabel', null, vscode.TreeItemCollapsibleState.None);

            const element = helpViewProvider.getTreeItem(fakeElement);

            assert.deepStrictEqual(element, fakeElement);
        });
    });

    describe('refresh', () => {
        it('The refresh function should be able to use _onDidChangeTreeData eventEmitter to fire undefined', () => {
            const eventEmitterSpy = sandbox.stub(vscode.EventEmitter.prototype, 'fire');
            helpViewProvider.refresh();

            assert.ok(eventEmitterSpy.calledOnceWith(undefined));
        });
    });
});
