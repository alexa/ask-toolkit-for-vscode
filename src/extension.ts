import * as vscode from 'vscode';
import { registerCommands as apiRegisterCommands, AbstractWebView, Utils } from './runtime';

import { CloneSkillCommand } from './askContainer/commands/cloneSkill/cloneSkill';
import { CloneSkillFromConsoleCommand } from './askContainer/commands/cloneSkillFromConsole';
import { DeployHostedSkillCommand } from './askContainer/commands/deployHostedSkill';
import { DeployNonHostedSkillCommand } from './askContainer/commands/deployNonHostedSkill';
import { SimulateSkillCommand } from './askContainer/commands/simulateSkill';
import { SimulateReplayCommand } from './askContainer/commands/simulateReplay';
import { ChangeSimulatorViewportCommand } from './askContainer/commands/changeSimulatorViewport';
import { SyncInteractionModelCommand } from './askContainer/commands/syncInteractionModel';
import { SyncManifestCommand } from './askContainer/commands/syncManifest';
import { RefreshSkillActionsCommand } from './askContainer/commands/refreshSkillActions';
import { InitCommand } from './askContainer/commands/init';
import { CreateSkillCommand } from './askContainer/commands/createSkill';
import { ListSkillsCommand } from './askContainer/commands/listSkills';
import { ViewAllSkillsCommand } from './askContainer/commands/viewAllSkills';
import { ChangeProfileCommand } from './askContainer/commands/changeProfile';
import { LoginCommand } from './askContainer/commands/login';
import { ExportSkillPackageCommand } from './askContainer/commands/exportSkillPackage';
import { ProfileManagerWebview } from './askContainer/webViews/profileManagerWebview';
import { WelcomeScreenWebview } from './askContainer/webViews/welcomeScreenWebview';
import { SkillsConsoleView } from './askContainer/treeViews/skillConsoleView';
import { SkillActionsView } from './askContainer/treeViews/skillActionsView';
import { OpenWorkspaceCommand } from './utils/commands/openWorkspace';
import { OpenUrlCommand } from './utils/commands/openUrl';
import { ContactToolkitTeamCommand } from './utils/commands/contactToolkitTeam';
import { GetToolkitInfoCommand } from './utils/commands/getToolkitInfo';
import { findSkillFoldersInWs, setSkillContext, unsetSkillContext } from './utils/workspaceHelper';
import { HelpView } from './askContainer/treeViews/helpView';
import { onWorkspaceOpenEventEmitter, onSkillConsoleViewChangeEventEmitter } from './askContainer/events';
import { createStatusBarItem } from './utils/statusBarHelper';
import { registerWebviews, disposeWebviews } from './utils/webViews/viewManager';
import { CreateSkillWebview } from './askContainer/webViews/createSkillWebview/createSkillWebview';
import { DeployHostedSkillWebview } from './askContainer/webViews/deploySkillWebview/deployHostedSkillWebview';
import { DeployNonHostedSkillWebview } from './askContainer/webViews/deploySkillWebview/deployNonHostedSkillWebview';
import { SimulateSkillWebview } from './askContainer/webViews/simulateSkillWebview';
import { InteractionModelSyncWebview } from './askContainer/webViews/interactionModelSync';
import { ManifestSyncWebview } from './askContainer/webViews/manifestSync';
import {
    EXTENSION_STATE_KEY,
    EXTENSION_ID,
    MULTIPLE_SKILLS_MSG,
    CLI_V1_SKILL_MSG,
    CLI_V1_GLOB_PATTERN,
    TELEMETRY_NOTIFICATION_MESSAGE,
    SEEN_TELEMETRY_NOTIFICATION_MESSAGE_KEY,
    DEFAULT_PROFILE,
} from './constants';
import { Logger, LogLevel } from './logger';
import { AccessTokenCommand } from './askContainer/commands/accessToken';
import { GetSkillIdFromWorkspaceCommand } from './askContainer/commands/skillIdFromWorkspaceCommand';
import { DebugAdapterPathCommand } from './askContainer/commands/local-debug/debugAdapterPath';
import { hostedSkillsClone } from './utils/urlHandlers';
import { SyncAplResourceCommand } from './aplContainer/commands/syncAplResource';
import { CreateAplDocumentFromSampleCommand } from './aplContainer/commands/createAplDocumentFromSample';
import { PreviewAplCommand } from './aplContainer/commands/previewApl';
import { ChangeViewportProfileCommand } from './aplContainer/commands/changeViewportProfile';
import { addAplDiagnostics } from './aplContainer/utils/aplDiagnositicsHelper';
import { AplPreviewWebView } from './aplContainer/webViews/aplPreviewWebView';
import { clearCachedSkills } from './utils/skillHelper';
import { checkAllSkillS3Scripts } from './utils/s3ScriptChecker';
import { authenticate } from './utils/webViews/authHelper';
import { ext } from './extensionGlobals';
import { ShowToolkitUpdatesCommand } from './askContainer/commands/showToolkitUpdates';
import { ToolkitUpdateWebview } from './askContainer/webViews/toolkitUpdateWebview';
import { InitialLoginWebview } from './askContainer/webViews/initialLogin';
import { WelcomeCommand } from './askContainer/commands/welcome';
import { SchemaManager } from './utils/schemaHelper';

const DEFAULT_LOG_LEVEL = LogLevel.info;

function registerCommands(context: vscode.ExtensionContext): void {
    Logger.debug('Registering commands in the extension');
    const profileManager: ProfileManagerWebview = new ProfileManagerWebview(
        'Profile manager',
        'profileManager',
        context
    );
    const createSkill: CreateSkillWebview = new CreateSkillWebview('Create new skill', 'createSkill', context);
    const toolkitUpdate: ToolkitUpdateWebview = new ToolkitUpdateWebview("What's New?", 'toolkitUpdate', context);
    registerWebviews(profileManager, createSkill, toolkitUpdate);
    ext.askGeneralCommands = [
        new ListSkillsCommand(),
        new OpenWorkspaceCommand(),
        new OpenUrlCommand(),
        new InitCommand(profileManager),
        new GetToolkitInfoCommand(),
        new ViewAllSkillsCommand(),
        new CreateSkillCommand(createSkill),
        new CloneSkillCommand(),
        new ChangeProfileCommand(),
        new AccessTokenCommand(),
        new DebugAdapterPathCommand(),
        new CloneSkillFromConsoleCommand(),
        new ShowToolkitUpdatesCommand(toolkitUpdate),
        new ContactToolkitTeamCommand(),
        new WelcomeCommand(context),
        new ExportSkillPackageCommand(),
    ];

    apiRegisterCommands(context, ext.askGeneralCommands);
}

async function registerSkillActionComponents(context: vscode.ExtensionContext): Promise<void> {
    // Register skill specific components, if skill is detected
    const skillFolders = await findSkillFoldersInWs();
    void context.workspaceState.update(EXTENSION_STATE_KEY.WS_SKILLS, skillFolders);

    if (skillFolders.length > 0) {
        const deployHostedSkill: DeployHostedSkillWebview = new DeployHostedSkillWebview(
            'Deploy skill',
            'deployHostedSkill',
            context
        );
        const deployNonHostedSkill: DeployNonHostedSkillWebview = new DeployNonHostedSkillWebview(
            'Deploy skill',
            'deployNonHostedPackage',
            context
        );
        const simulateSkill: SimulateSkillWebview = new SimulateSkillWebview(
            'Simulate skill',
            'simulateSkill',
            context
        );
        const syncInteractionModelView = new InteractionModelSyncWebview(
            'Download interaction model',
            'syncInteractionModel',
            context
        );
        const syncManifestView = new ManifestSyncWebview('Download manifest', 'syncManifest', context);
        const aplPreviewWebView: AplPreviewWebView = new AplPreviewWebView('APL Preview', 'previewApl', context);

        registerWebviews(
            deployHostedSkill,
            deployNonHostedSkill,
            simulateSkill,
            syncInteractionModelView,
            aplPreviewWebView,
            syncManifestView
        );

        ext.askSkillCommands = [
            new DeployHostedSkillCommand(deployHostedSkill),
            new DeployNonHostedSkillCommand(deployNonHostedSkill),
            new SyncInteractionModelCommand(syncInteractionModelView),
            new GetSkillIdFromWorkspaceCommand(),
            new SyncManifestCommand(syncManifestView),
            new CreateAplDocumentFromSampleCommand(aplPreviewWebView),
            new ChangeViewportProfileCommand(aplPreviewWebView),
            new PreviewAplCommand(aplPreviewWebView),
            new SyncAplResourceCommand(),
            new RefreshSkillActionsCommand(),
            new SimulateSkillCommand(simulateSkill),
            new SimulateReplayCommand(simulateSkill),
            new ChangeSimulatorViewportCommand(simulateSkill),
        ];

        apiRegisterCommands(context, ext.askSkillCommands);

        if (skillFolders.length === 1) {
            void SchemaManager.getInstance().updateSchemas();

            // tslint:disable-next-line: no-unused-expression
            new SkillActionsView(context);
            setSkillContext();
        } else {
            unsetSkillContext();
            if (skillFolders.length > 1) {
                void vscode.window.showWarningMessage(MULTIPLE_SKILLS_MSG);
                Logger.info(MULTIPLE_SKILLS_MSG);
            }
        }
    } else {
        unsetSkillContext();
        const cliV1Folders = await vscode.workspace.findFiles(CLI_V1_GLOB_PATTERN);
        if (cliV1Folders.length > 0) {
            void vscode.window.showWarningMessage(CLI_V1_SKILL_MSG);
            Logger.info(CLI_V1_SKILL_MSG);
        }
    }
}

function registerTreeViews(context: vscode.ExtensionContext): void {
    Logger.debug('Registering treeviews in the extension');

    const skillConsoleView = new SkillsConsoleView(context);
    const helpView = new HelpView(context);
    ext.treeViews.push(skillConsoleView, helpView);
}

function showLoginScreen(context: vscode.ExtensionContext): void {
    apiRegisterCommands(context, [new LoginCommand(context)]);
    void vscode.commands.executeCommand('ask.login');
}

async function registerViews(context: vscode.ExtensionContext): Promise<void> {
    Logger.debug('Registering views in the extension');

    if (
        vscode.workspace
            .getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME)
            .get(EXTENSION_STATE_KEY.SHOW_WELCOME_SCREEN) === true
    ) {
        const welcomeScreen: WelcomeScreenWebview = new WelcomeScreenWebview(
            'Alexa Skills Kit',
            'welcomeScreen',
            context
        );

        registerWebviews(welcomeScreen);
        if (
            (await Utils.isProfileAuth(context)) &&
            context.globalState.get(EXTENSION_STATE_KEY.DID_FIRST_TIME_LOGIN) === true
        ) {
            void vscode.commands.executeCommand('ask.welcome');
        } else {
            showLoginScreen(context);
        }
    }
}

function registerEventHandlers(context: vscode.ExtensionContext): void {
    Logger.debug('Registering event handlers in the extension');
    context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders(async () => {
            Logger.info('Workspace folders changed event handler');
            const skillFolders = await findSkillFoldersInWs();
            void context.workspaceState.update(EXTENSION_STATE_KEY.WS_SKILLS, skillFolders);
            if (skillFolders.length === 1) {
                // update vendor specific schemas upon workspace change.
                void SchemaManager.getInstance().updateSchemas();

                setSkillContext();
                const skillActionView = new SkillActionsView(context);
                ext.treeViews.push(skillActionView);
            } else {
                unsetSkillContext();
            }
            onWorkspaceOpenEventEmitter.fire(undefined);
            disposeWebviews();
        })
    );
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(configChangedEvent => {
            if (
                configChangedEvent.affectsConfiguration(
                    `${EXTENSION_STATE_KEY.CONFIG_SECTION_NAME}.${EXTENSION_STATE_KEY.LOG_LEVEL}`
                )
            ) {
                const newLogLevel = vscode.workspace
                    .getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME)
                    .get(EXTENSION_STATE_KEY.LOG_LEVEL, DEFAULT_LOG_LEVEL);
                Logger.logLevel = newLogLevel;
                Logger.info(`log level changed to ${newLogLevel}`);
            }
        })
    );
    // register APL diagnostics event handlers
    addAplDiagnostics(context);
}

function registerUrlHooks(context: vscode.ExtensionContext): void {
    vscode.window.registerUriHandler({
        async handleUri(uri: vscode.Uri) {
            if (uri.path === '/clone') {
                const profiles = Utils.listExistingProfileNames();
                if (!profiles) {
                    void vscode.window.showInformationMessage(
                        "Before you can clone your skill, you'll need" +
                            ' to login to your developer account in the extension.'
                    );
                    void vscode.commands.executeCommand('ask.login', true);
                    await authenticate(context, undefined, DEFAULT_PROFILE);
                }
                await hostedSkillsClone(uri, context);
            }
        },
    });
}

function getProfileSBInfo(context: vscode.ExtensionContext): [string, string] {
    const profileName: string | undefined = context.globalState.get(EXTENSION_STATE_KEY.LWA_PROFILE);
    let title: string;
    let tooltip: string;
    if (profileName === undefined) {
        title = '$(person-filled) ASK Profile : None';
        tooltip = 'No profile selected. Please consider signing in first.';
    } else {
        title = `$(person-filled) ASK Profile: ${profileName}`;
        tooltip = `Signed into '${profileName}' profile.`;
    }
    return [title, tooltip];
}

function updateProfileIcon(context: vscode.ExtensionContext, sbItem: vscode.StatusBarItem): void {
    Logger.verbose('Updating profile icon in the extension');
    const onDidChangeTreeData = onSkillConsoleViewChangeEventEmitter.event;
    onDidChangeTreeData(() => {
        const [title, tooltip] = getProfileSBInfo(context);
        sbItem.text = title;
        sbItem.tooltip = tooltip;
        sbItem.show();
    });
}

function addStatusBarItems(context: vscode.ExtensionContext): void {
    Logger.debug('Registering statusbar in the extension');
    const [title, tooltip] = getProfileSBInfo(context);

    const currentProfileIcon = createStatusBarItem(2, 'ask.changeProfile', title, tooltip);

    const profileName = context.globalState.get(EXTENSION_STATE_KEY.LWA_PROFILE);
    if (profileName === undefined) {
        // Hide status bar for first time user
        currentProfileIcon.hide();
    }

    updateProfileIcon(context, currentProfileIcon);

    const contactAlexaIcon = createStatusBarItem(
        3,
        'ask.contactToolkitTeam',
        '$(mail) Contact Alexa',
        'Contact Alexa Team for any extension questions'
    );

    context.subscriptions.push(currentProfileIcon);
    context.subscriptions.push(contactAlexaIcon);
}

function checkIfUpdated(context: vscode.ExtensionContext): void {
    Logger.debug(`Checking if extension version is latest`);
    const lastKnownVersion = context.globalState.get(EXTENSION_STATE_KEY.CURRENT_VERSION);
    const extVersion = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
    if (lastKnownVersion !== extVersion) {
        if (lastKnownVersion !== undefined) {
            const msg = 'The Alexa Skills Kit extension has been updated.';
            Logger.info(msg);
            void vscode.window.showInformationMessage(msg);
            void vscode.commands.executeCommand('ask.showToolkitUpdates');
        }
        void context.globalState.update(EXTENSION_STATE_KEY.CURRENT_VERSION, extVersion);
    }
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    ext.context = context;
    // Initialize the logger
    Logger.configure(
        context,
        vscode.workspace
            .getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME)
            .get(EXTENSION_STATE_KEY.LOG_LEVEL, DEFAULT_LOG_LEVEL)
    );
    Logger.info('Activating extension');

    registerUrlHooks(context);
    // Register common components
    const profiles = Utils.listExistingProfileNames();
    if (!profiles) {
        void context.globalState.update(EXTENSION_STATE_KEY.LWA_PROFILE, undefined);
        void context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, {});
        Logger.debug('No profiles found in the extension.');
    } else {
        const currentProfile = Utils.getCachedProfile(context);
        if (currentProfile === undefined || !profiles.includes(currentProfile)) {
            void context.globalState.update(EXTENSION_STATE_KEY.LWA_PROFILE, profiles[0]);
            clearCachedSkills(context);
        }
    }
    registerCommands(context);
    await registerViews(context);
    registerEventHandlers(context);

    addStatusBarItems(context);
    registerTreeViews(context);

    checkAllSkillS3Scripts(context);
    // Register skill specific components, if skill is detected
    if (await Utils.isProfileAuth(context)) {
        await registerSkillActionComponents(context);
    }

    const seenNotification = context.globalState.get(SEEN_TELEMETRY_NOTIFICATION_MESSAGE_KEY);
    if (seenNotification === undefined) {
        void vscode.window.showInformationMessage(TELEMETRY_NOTIFICATION_MESSAGE);
        void context.globalState.update(SEEN_TELEMETRY_NOTIFICATION_MESSAGE_KEY, true);
    }

    checkIfUpdated(context);
}

// this method is called when your extension is deactivated
export function deactivate(): void {}
