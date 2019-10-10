import * as vscode from "vscode";

export class ExtensionStatus {
  private active = false;
  private connected = false;

  constructor(private statusBar: vscode.StatusBarItem) {
    this.setAsConnecting();

    this.show();
  }

  show() {
    this.statusBar.show();
  }

  hide() {
    this.statusBar.hide();
  }

  setAsConnecting() {
    this.connected = false;

    this.update();
  }

  setAsConnected() {
    this.connected = true;

    this.update();
  }

  setActive() {
    this.active = true;

    this.update();
  }

  setInactive() {
    this.active = false;

    this.update();
  }

  update() {
    let connectionStatus = this.connected ? "Connected" : "Connecting";

    if (this.active) {
      connectionStatus += " | Active";
    }

    this.statusBar.text = `Deck | ${connectionStatus}`;
  }
}
