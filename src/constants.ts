export const InternalExtensionId = "vscode-streamdeck";
export const ExtensionId = `nicollasricas.${InternalExtensionId}`;
export const ExtensionScheme = "streamdeck";
export const OutputChannelName = "Stream Deck";

export enum Commands {
  Reconnect = "reconnectToServer",
  ActivateSession = "activateSession"
}

export enum Configurations {
  ServerHost = "streamdeck.serverHost",
  ServerPort = "streamdeck.serverPort"
}
