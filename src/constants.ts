export const InternalExtensionId = "vscode-streamdeck";
export const ExtensionId = `nicollasricas.${InternalExtensionId}`;
export const ExtensionScheme = "streamdeck";
export const ExtensionLanguage = "witcherscript";
export const ExtensionName = "Witcher Script";
export const OutputChannelName = "Stream Deck";

export enum GlobalState {
  WitcherScriptVersion = "witcherscriptVersion"
}

export enum Commands {
  Reconnect = "reconnectToServer"
}

export enum Configurations {
  ServerHost = "streamdeck.serverHost",
  ServerPort = "streamdeck.serverPort"
}

export enum Pages {
  Welcome = "welcome-page",
  Settings = "settings-page"
}

export enum Strings {
  NewPackagePrompt = "Package name",
  NewPackagePlaceHolder = "E.g:: modHDReworkedProject",
  GamePathIsRequired = "The game path is required.",
  UncookedBasePathIsRequired = "The uncooked base path is required.",
  CurrentWorkspaceNotWicherPackage = "The current workspace are not a witcher package.",
  FileAlreadyExists = "This file already exists, override it?",
  WorkspaceFolderRequired = "A workspace folder is required to cook packages",
  PackageCooked = "Cooked.",
  LaunchGame = "Launch Game"
}
