import * as vscode from "vscode";
import { EventList, IEvent } from "strongly-typed-events";
import { TerminalCreateMessage } from "./messages/terminalCreateMessage";
import { Message } from "./messages/message";
import { ExtensionStatus } from "./extensionStatus";
import { TerminalCommandMessage } from "./messages/terminalCommandMessage";
import { CommandMessage } from "./messages/commandMessage";
import { ActiveSessionChangedMessage } from "./messages/activeSessionChangedMessage";
import { ExtensionHub } from "./extensionHub";
import { ExtensionConfiguration } from "./configuration";
import { ChangeSessionMessage } from "./messages/ChangeSessionMessage";

export class ExtensionController {
  private hub!: ExtensionHub;
  private status: ExtensionStatus;
  private eventDispatcher: EventList<ExtensionController, any> = new EventList<ExtensionController, any>();

  constructor(statusBar: vscode.StatusBarItem, private outputChannel: vscode.OutputChannel, configuration: ExtensionConfiguration) {
    this.status = new ExtensionStatus(statusBar);

    this.createStreamDeckHub(configuration);
  }

  activate() {
    this.connect();
  }

  private createStreamDeckHub(configuration: ExtensionConfiguration) {
    this.hub = new ExtensionHub(configuration.host, configuration.port);
    this.hub.onConnected.subscribe(() => this.onConnected());
    this.hub.onDisconnected.subscribe(() => this.onDisconnected());
    this.hub.onMessageReceived.subscribe(message => this.onMessageReceived(message));
  }

  private connect() {
    this.status.setAsConnecting();

    this.outputChannel.appendLine("Connecting to stream deck");

    this.hub.connect();
  }

  public configurationChanged(configuration: ExtensionConfiguration) {
    if (this.hub) {
      this.hub.disconnect();
    }

    this.createStreamDeckHub(configuration);

    this.connect();
  }

  public deactivate() {
    this.onCommand.clear();
    this.onActiveSessionChanged.clear();
    this.onTerminalCommand.clear();
    this.onTerminalCreate.clear();

    this.hub.disconnect();
  }

  reconnect() {
    this.outputChannel.appendLine("Reconnecting to stream deck...");

    this.connect();
  }

  private onConnected() {
    this.status.setAsConnected();

    this.outputChannel.appendLine("Connected to stream deck.");
  }

  private onMessageReceived(message: Message) {
    try {
      this.outputChannel.appendLine(`Stream Deck event received ${message}.`);

      this.eventDispatcher.get(message.id).dispatchAsync(this, JSON.parse(message.data));
    } catch {}
  }

  private onDisconnected() {
    this.status.setAsConnecting();

    this.outputChannel.appendLine("Disconnected from stream deck.");

    this.connect();
  }

  changeActiveSession(sessionId: string) {
    this.hub.send(<ChangeSessionMessage>{
      sessionId: sessionId
    });
  }

  setSessionAsActive() {
    this.status.setActive();
  }

  setSessionAsInactive() {
    this.status.setInactive();
  }

  get onCommand() {
    return <IEvent<ExtensionController, CommandMessage>>this.eventDispatcher.get(CommandMessage.name).asEvent();
  }

  get onTerminalCreate() {
    return <IEvent<ExtensionController, TerminalCreateMessage>>this.eventDispatcher.get(TerminalCreateMessage.name).asEvent();
  }

  get onTerminalCommand() {
    return <IEvent<ExtensionController, TerminalCommandMessage>>this.eventDispatcher.get(TerminalCommandMessage.name).asEvent();
  }

  get onActiveSessionChanged() {
    return <IEvent<ExtensionController, ActiveSessionChangedMessage>>this.eventDispatcher.get(ActiveSessionChangedMessage.name).asEvent();
  }
}
