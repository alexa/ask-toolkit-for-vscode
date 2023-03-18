/*---------------------------------------------------------------------------------------------
 *  Alexa Skills Toolkit for Visual Studio Code
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: Apache-2.0
 *--------------------------------------------------------------------------------------------*/
import * as path from "path";
import * as vscode from "vscode";
import {LanguageClient, LanguageClientOptions, ServerOptions, TransportKind} from "vscode-languageclient/node";
import {registerCommands as apiRegisterCommands, Utils} from "./runtime";

import {CloneSkillCommand} from "./askContainer/commands/cloneSkill/cloneSkill";
import {CloneSkillFromConsoleCommand} from "./askContainer/commands/cloneSkillFromConsole";
import {DeployHostedSkillCommand} from "./askContainer/commands/deployHostedSkill";
import {DeployNonHostedSkillCommand} from "./askContainer/commands/deployNonHostedSkill";
import {SimulateSkillCommand} from "./askContainer/commands/simulateSkill";
import {SimulateReplayCommand} from "./askContainer/commands/simulateReplay";
import {ChangeSimulatorViewportCommand} from "./askContainer/commands/changeSimulatorViewport";
import {SyncInteractionModelCommand} from "./askContainer/commands/syncInteractionModel";
import {SyncManifestCommand} from "./askContainer/commands/syncManifest";
import {RefreshSkillActionsCommand} from "./askContainer/commands/refreshSkillActions";
import {InitCommand} from "./askContainer/commands/init";
import {CreateSkillCommand} from "./askContainer/commands/createSkill";
import {ListSkillsCommand} from "./askContainer/commands/listSkills";
import {ViewAllSkillsCommand} from "./askContainer/commands/viewAllSkills";
import {ChangeProfileCommand} from "./askContainer/commands/changeProfile";
import {LoginCommand} from "./askContainer/commands/login";
import {ExportSkillPackageCommand} from "./askContainer/commands/exportSkillPackage";
import {ProfileManagerWebview} from "./askContainer/webViews/profileManagerWebview";
import {WelcomeScreenWebview} from "./askContainer/webViews/welcomeScreenWebview";
import {SkillsConsoleView} from "./askContainer/treeViews/skillConsoleView";
import {SkillActionsView} from "./askContainer/treeViews/skillActionsView";
import {OpenWorkspaceCommand} from "./utils/commands/openWorkspace";
import {OpenUrlCommand} from "./utils/commands/openUrl";
import {ContactToolkitTeamCommand} from "./utils/commands/contactToolkitTeam";
import {GetToolkitInfoCommand} from "./utils/commands/getToolkitInfo";
import {findSkillFoldersInWs, setSkillContext, unsetSkillContext} from "./utils/workspaceHelper";
import {HelpView} from "./askContainer/treeViews/helpView";
import {
  onWorkspaceOpenEventEmitter,
  onSkillConsoleViewChangeEventEmitter,
  onDeviceRegistrationEventEmitter,
  onDeviceDeletionEventEmitter,
} from "./askContainer/events";
import {createStatusBarItem} from "./utils/statusBarHelper";
import {registerWebviews, disposeWebviews} from "./utils/webViews/viewManager";
import {CreateSkillWebview} from "./askContainer/webViews/createSkillWebview/createSkillWebview";
import {DeployHostedSkillWebview} from "./askContainer/webViews/deploySkillWebview/deployHostedSkillWebview";
import {DeployNonHostedSkillWebview} from "./askContainer/webViews/deploySkillWebview/deployNonHostedSkillWebview";
import {SimulateSkillWebview} from "./askContainer/webViews/simulateSkillWebview";
import {InteractionModelSyncWebview} from "./askContainer/webViews/interactionModelSync";
import {ManifestSyncWebview} from "./askContainer/webViews/manifestSync";
import {
  EXTENSION_STATE_KEY,
  EXTENSION_ID,
  MULTIPLE_SKILLS_MSG,
  CLI_V1_SKILL_MSG,
  CLI_V1_GLOB_PATTERN,
  TELEMETRY_NOTIFICATION_MESSAGE,
  SEEN_TELEMETRY_NOTIFICATION_MESSAGE_KEY,
  DEFAULT_PROFILE,
  ACDL_LANGUAGE_SERVER,
} from "./constants";
import {Logger, LogLevel} from "./logger";
import {AccessTokenCommand} from "./askContainer/commands/accessToken";
import {GetSkillIdFromWorkspaceCommand} from "./askContainer/commands/skillIdFromWorkspaceCommand";
import {DebugAdapterPathCommand} from "./askContainer/commands/local-debug/debugAdapterPath";
import {hostedSkillsClone} from "./utils/urlHandlers";
import {SyncAplResourceCommand} from "./aplContainer/commands/syncAplResource";
import {CreateAplDocumentFromSampleCommand} from "./aplContainer/commands/createAplDocumentFromSample";
import {PreviewAplCommand} from "./aplContainer/commands/previewApl";
import {ChangeViewportProfileCommand} from "./aplContainer/commands/changeViewportProfile";
import {addAplDiagnostics} from "./aplContainer/utils/aplDiagnositicsHelper";
import {AplPreviewWebView} from "./aplContainer/webViews/aplPreviewWebView";
import {clearCachedSkills} from "./utils/skillHelper";
import {checkAllSkillS3Scripts} from "./utils/s3ScriptChecker";
import {authenticate} from "./utils/webViews/authHelper";
import {ext} from "./extensionGlobals";
import {ShowToolkitUpdatesCommand} from "./askContainer/commands/showToolkitUpdates";
import {ToolkitUpdateWebview} from "./askContainer/webViews/toolkitUpdateWebview";
import {WelcomeCommand} from "./askContainer/commands/welcome";
import {SchemaManager} from "./utils/schemaHelper";
import {DeviceRegistryWebview} from "./askContainer/webViews/deviceRegistryWebview";
import {DeviceRegistryCommand} from "./askContainer/commands/deviceRegistryCommand";
import {DeviceDeletionCommand} from "./askContainer/commands/deviceDeletionCommand";

import {TelemetryClient} from "./runtime/lib/telemetry";
import { MetricAction } from "./runtime/lib/telemetry/metricAction";

let client: LanguageClient;

const DEFAULT_LOG_LEVEL = LogLevel.info;

function registerCommands(context: vscode.ExtensionContext): void {
  Logger.debug("Registering commands in the extension");
  const profileManager: ProfileManagerWebview = new ProfileManagerWebview("Profile manager", "profileManager", context);
  const createSkill: CreateSkillWebview = new CreateSkillWebview("Create new skill", "createSkill", context);
  const toolkitUpdate: ToolkitUpdateWebview = new ToolkitUpdateWebview("What's New?", "toolkitUpdate", context);
  const deviceRegistry: DeviceRegistryWebview = new DeviceRegistryWebview("Device registry", "deviceRegistry", context);
  registerWebviews(profileManager, createSkill, toolkitUpdate, deviceRegistry);
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
    new DeviceRegistryCommand(deviceRegistry),
    new DeviceDeletionCommand(),
  ];

  apiRegisterCommands(context, ext.askGeneralCommands);
}

async function registerSkillActionComponents(context: vscode.ExtensionContext): Promise<void> {
  // Register skill specific components, if skill is detected
  const skillFolders = await findSkillFoldersInWs();
  void context.workspaceState.update(EXTENSION_STATE_KEY.WS_SKILLS, skillFolders);

  if (skillFolders.length > 0) {
    const deployHostedSkill: DeployHostedSkillWebview = new DeployHostedSkillWebview("Deploy skill", "deployHostedSkill", context);
    const deployNonHostedSkill: DeployNonHostedSkillWebview = new DeployNonHostedSkillWebview(
      "Deploy skill",
      "deployNonHostedPackage",
      context,
    );
    const simulateSkill: SimulateSkillWebview = new SimulateSkillWebview("Simulate skill", "simulateSkill", context);
    const syncInteractionModelView = new InteractionModelSyncWebview("Download interaction model", "syncInteractionModel", context);
    const syncManifestView = new ManifestSyncWebview("Download manifest", "syncManifest", context);
    const aplPreviewWebView: AplPreviewWebView = new AplPreviewWebView("APL Preview", "previewApl", context);

    registerWebviews(deployHostedSkill, deployNonHostedSkill, simulateSkill, syncInteractionModelView, aplPreviewWebView, syncManifestView);

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
  Logger.debug("Registering treeviews in the extension");

  const skillConsoleView = new SkillsConsoleView(context);
  const helpView = new HelpView(context);
  ext.treeViews.push(skillConsoleView, helpView);
}

function showLoginScreen(context: vscode.ExtensionContext): void {
  apiRegisterCommands(context, [new LoginCommand(context)]);
  void vscode.commands.executeCommand("ask.login");
}

async function registerViews(context: vscode.ExtensionContext): Promise<void> {
  Logger.debug("Registering views in the extension");

  if (vscode.workspace.getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME).get(EXTENSION_STATE_KEY.SHOW_WELCOME_SCREEN) === true) {
    const welcomeScreen: WelcomeScreenWebview = new WelcomeScreenWebview("Alexa Skills Kit", "welcomeScreen", context);

    registerWebviews(welcomeScreen);
    if ((await Utils.isProfileAuth(context)) && context.globalState.get(EXTENSION_STATE_KEY.DID_FIRST_TIME_LOGIN) === true) {
      void vscode.commands.executeCommand("ask.welcome");
    } else {
      showLoginScreen(context);
    }
  }
}

function registerEventHandlers(context: vscode.ExtensionContext): void {
  Logger.debug("Registering event handlers in the extension");
  context.subscriptions.push(
    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
      Logger.info("Workspace folders changed event handler");
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
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((configChangedEvent) => {
      if (configChangedEvent.affectsConfiguration(`${EXTENSION_STATE_KEY.CONFIG_SECTION_NAME}.${EXTENSION_STATE_KEY.LOG_LEVEL}`)) {
        const newLogLevel = vscode.workspace
          .getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME)
          .get(EXTENSION_STATE_KEY.LOG_LEVEL, DEFAULT_LOG_LEVEL);
        Logger.logLevel = newLogLevel;
        Logger.info(`log level changed to ${newLogLevel}`);
      }
    }),
  );
  // register APL diagnostics event handlers
  addAplDiagnostics(context);
}

function registerUrlHooks(context: vscode.ExtensionContext): void {
  vscode.window.registerUriHandler({
    async handleUri(uri: vscode.Uri) {
      if (uri.path === "/clone") {
        const profiles = Utils.listExistingProfileNames();
        if (!profiles) {
          void vscode.window.showInformationMessage(
            "Before you can clone your skill, you'll need" + " to login to your developer account in the extension.",
          );
          void vscode.commands.executeCommand("ask.login", true);
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
    title = "$(person-filled) ASK Profile : None";
    tooltip = "No profile selected. Please consider signing in first.";
  } else {
    title = `$(person-filled) ASK Profile: ${profileName}`;
    tooltip = `Signed into '${profileName}' profile.`;
  }
  return [title, tooltip];
}

function updateProfileIcon(context: vscode.ExtensionContext, sbItem: vscode.StatusBarItem): void {
  Logger.verbose("Updating profile icon in the extension");
  const onDidChangeTreeData = onSkillConsoleViewChangeEventEmitter.event;
  onDidChangeTreeData(() => {
    const [title, tooltip] = getProfileSBInfo(context);
    sbItem.text = title;
    sbItem.tooltip = tooltip;
    sbItem.show();
  });
}

async function getDeviceInfo(context: vscode.ExtensionContext): Promise<[string | undefined, string]> {
  const productId: string | undefined = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.PRODUCT_ID);
  const isValid: string | undefined = await context.secrets.get(EXTENSION_STATE_KEY.REGISTERED_DEVICE.VALID_DEVICE);
  let title: string | undefined;
  let tooltip = "";
  if (productId === undefined || isValid !== "true") {
    title = undefined;
  } else {
    title = `$(circuit-board) Device: ${productId}`;
    tooltip = `The device in use.`;
  }
  return [title, tooltip];
}

function updateDeviceInfo(context: vscode.ExtensionContext, sbItem: vscode.StatusBarItem): void {
  onDeviceRegistrationEventEmitter.event(async () => {
    Logger.verbose("Device registered. Updating device information in status bar");
    const [deviceTitle, deviceTooltip] = await getDeviceInfo(context);
    sbItem.text = deviceTitle!;
    sbItem.tooltip = deviceTooltip;
    sbItem.show();
  });

  onDeviceDeletionEventEmitter.event(() => {
    Logger.verbose("Device deleted. Updating device information in status bar");
    sbItem.hide();
  });
}

async function addStatusBarItems(context: vscode.ExtensionContext): Promise<void> {
  Logger.debug("Registering statusbar in the extension");
  const [profileTitle, profileTooltip] = getProfileSBInfo(context);

  const currentProfileIcon = createStatusBarItem(2, "ask.changeProfile", profileTitle, profileTooltip);

  const profileName = context.globalState.get(EXTENSION_STATE_KEY.LWA_PROFILE);
  if (profileName === undefined) {
    // Hide status bar for first time user
    currentProfileIcon.hide();
  }

  updateProfileIcon(context, currentProfileIcon);

  const contactAlexaIcon = createStatusBarItem(
    3,
    "ask.contactToolkitTeam",
    "$(mail) Contact Alexa",
    "Contact Alexa Team for any extension questions",
  );

  // Displays when ACDL validations are running and is shown/hidden by the language server. Starts hidden.
  const validationsRunningIcon = createStatusBarItem(
    1,
    "workbench.action.problems.focus",
    "$(sync~spin) ACDL Validation in progress",
    "Current running ACDL compiler validations.",
  );
  validationsRunningIcon.hide();

  // Command for language server to invoke to show status bar item when ACDL validations are running
  context.subscriptions.push(
    vscode.commands.registerCommand("ask.showACDLValidationStatus", () => {
      validationsRunningIcon.show();
    }),
  );

  // Command for language server to invoke to hide status bar item when ACDL validations are complete
  context.subscriptions.push(
    vscode.commands.registerCommand("ask.hideACDLValidationStatus", () => {
      validationsRunningIcon.hide();
    }),
  );

  //add device info in status bar
  const [deviceTitle, DeviceTooltip] = await getDeviceInfo(context);
  const deviceIcon = createStatusBarItem(1, undefined, deviceTitle!, DeviceTooltip);
  if (deviceTitle === undefined) {
    deviceIcon.hide();
  }

  updateDeviceInfo(context, deviceIcon);

  context.subscriptions.push(validationsRunningIcon);
  context.subscriptions.push(currentProfileIcon);
  context.subscriptions.push(contactAlexaIcon);
  context.subscriptions.push(deviceIcon);
}

function checkIfUpdated(context: vscode.ExtensionContext): void {
  Logger.debug(`Checking if extension version is latest`);
  const lastKnownVersion = context.globalState.get(EXTENSION_STATE_KEY.CURRENT_VERSION);
  const extVersion = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
  if (lastKnownVersion !== extVersion) {
    if (lastKnownVersion !== undefined) {
      const msg = "The Alexa Skills Kit extension has been updated.";
      Logger.info(msg);
      void vscode.window.showInformationMessage(msg);
      void vscode.commands.executeCommand("ask.showToolkitUpdates");
    }
    void context.globalState.update(EXTENSION_STATE_KEY.CURRENT_VERSION, extVersion);
  }
}

// VS Code language server/client interop removes class functions the MetricAction objects, so we cache them client side
const acdlTelemetryActionStore : Map<string, MetricAction> = new Map<string, MetricAction>();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  ext.context = context;
  // Initialize the logger
  Logger.configure(
    context,
    vscode.workspace.getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME).get(EXTENSION_STATE_KEY.LOG_LEVEL, DEFAULT_LOG_LEVEL),
  );
  Logger.info("Activating extension");

  registerUrlHooks(context);
  // Register common components
  const profiles = Utils.listExistingProfileNames();
  if (!profiles) {
    void context.globalState.update(EXTENSION_STATE_KEY.LWA_PROFILE, undefined);
    void context.globalState.update(EXTENSION_STATE_KEY.CACHED_SKILLS, {});
    Logger.debug("No profiles found in the extension.");
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

  void addStatusBarItems(context);
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

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join("dist", "server", "acdlServer.js"));
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  const debugOptions = {execArgv: ["--nolazy", "--inspect=6009"]};

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {module: serverModule, transport: TransportKind.ipc},
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for acdl files
    documentSelector: [{scheme: "file", language: "acdl"}],
    workspaceFolder: vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0] : undefined,
    synchronize: {
      // Notify the server about file changes to '.json files contained in the workspace
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.json"),
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient("acdlLanguageServer", "ACDL Language Server", serverOptions, clientOptions);

  // Start the client. This will also launch the server
  client.start().then(() => {
    // Attach APIs for showing and hiding ACDL validation status
    client.onNotification(ACDL_LANGUAGE_SERVER.SHOW_VALIDATION_STATUS_NOTIFICATION, () => {
      vscode.commands.executeCommand(ACDL_LANGUAGE_SERVER.SHOW_VALIDATION_STATUS_CMD);
    });

    client.onNotification(ACDL_LANGUAGE_SERVER.HIDE_VALIDATION_STATUS_NOTIFICATION, () => {
      vscode.commands.executeCommand(ACDL_LANGUAGE_SERVER.HIDE_VALIDATION_STATUS_CMD);
    });

    // APIs for the Language Server to log telemetry events
    client.onRequest(ACDL_LANGUAGE_SERVER.START_TELEMETRY_ACTION, (param) => {
      const action = TelemetryClient.getInstance().startAction(param.actionName, param.actionType);
      acdlTelemetryActionStore[action.id] = action;
      return action.id;
    });

    client.onNotification(ACDL_LANGUAGE_SERVER.STORE_TELEMETRY_ACTION, (param) => {
      if(param.shouldStore) {
        TelemetryClient.getInstance().store(acdlTelemetryActionStore[param.actionId], param.errorMsg ? new Error(param.errorMsg) : undefined)
      }
      acdlTelemetryActionStore.delete(param.actionId);
    });

    // Letting the server know if they should be showing full namespaces for ACDL names
    client.sendRequest(
      ACDL_LANGUAGE_SERVER.SHOW_FULL_NAMESPACE_REQUEST,
      vscode.workspace.getConfiguration(EXTENSION_STATE_KEY.CONFIG_SECTION_NAME).get(EXTENSION_STATE_KEY.SHOW_FULL_ACDL_NAMESPACE),
    );
  });
}

// this method is called when your extension is deactivated
export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
