import * as vscode from "vscode";

export class StreamDeckStatus {
  private connectionStatus: vscode.StatusBarItem;

  constructor(context: vscode.ExtensionContext) {
    this.connectionStatus = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
    context.subscriptions.push(this.connectionStatus);

    this.setConnecting();

    this.show();
  }

  show() {
    this.connectionStatus.show();
  }

  hide() {
    this.connectionStatus.hide();
  }

  setConnecting() {
    this.connectionStatus.text = "Deck | Connecting";
    this.connectionStatus.tooltip = "connecting to Stream Deck, click to reconnect.";
  }

  setConnnected() {
    this.connectionStatus.text = "Deck | Connected";
    this.connectionStatus.tooltip = "";
  }

  setDisconnected() {
    this.connectionStatus.text = "Deck | Disconnected";
    this.connectionStatus.tooltip = "disconnected from Stream Deck, click to reconnect.";
  }
}
