export enum MetricActionResult {
    SUCCESS = "Success",
    FAILURE = "Failure",
}

export enum TelemetryEnabled {
    ENABLED = "Enabled",
    DISABLED = "Disabled",
    USE_IDE_SETTINGS = "Use IDE settings",
}

export enum ActionType {
    COMMAND = "command",
    EVENT = "event",
    TOOLS_DOCS_VSCODE = "TOOLS_DOCS_VSCODE",
    TOOLS_DOCS_CLI = "TOOLS_DOCS_CLI",
    TOOLS_DOCS_ASK_SDK = "TOOLS_DOCS_ASK_SDK",
    TOOLS_DOCS_SMAPI_SDK = "TOOLS_DOCS_SMAPI_SDK",
    IM_EDITOR = "IM_EDITOR",
    ACDL_SERVER = "ACDL_SERVER",
}
