import * as vscode from "vscode";
import { EventList, IEvent } from "strongly-typed-events";
import { CreateTerminalMessage } from "./messages/createTerminalMessage";
import { ExtensionStatus } from "./extensionStatus";
import { ExecuteTerminalCommandMessage } from "./messages/executeTerminalCommandMessage";
import { ExecuteCommandMessage } from "./messages/executeCommandMessage";
import { ActiveSessionChangedMessage } from "./messages/activeSessionChangedMessage";
import { ExtensionHub } from "./extensionHub";
import { ExtensionConfiguration } from "./configuration";
import { ChangeActiveSessionMessage } from "./messages/changeActiveSessionMessage";
import { Message } from "./messages/message";
import { ChangeLanguageMessage } from "./messages/changeLanguagMessage";
import { InsertSnippetMessage } from "./messages/InsertSnippetMessage";
import Logger from "./logger";
import { OpenFolderMessage } from "./messages/OpenFolderMessage";

export class ExtensionController {
  private hub!: ExtensionHub;
  private status: ExtensionStatus;
  private eventDispatcher: EventList<ExtensionController, any> = new EventList<ExtensionController, any>();

  constructor(statusBar: vscode.StatusBarItem, private sessionId: string, configuration: ExtensionConfiguration) {
    this.status = new ExtensionStatus(statusBar);

    this.createStreamDeckHub(configuration);
  }

  activate() {
    this.connect();
  }

  public deactivate() {
    this.onExecuteCommand.clear();
    this.onActiveSessionChanged.clear();
    this.onExecuteTerminalCommand.clear();
    this.onCreateTerminal.clear();

    this.hub.disconnect();
  }

  private createStreamDeckHub(configuration: ExtensionConfiguration) {
    this.hub = new ExtensionHub(configuration.host, configuration.port, this.sessionId);
    this.hub.onConnected.subscribe(() => this.onConnected());
    this.hub.onDisconnected.subscribe(() => this.onDisconnected());
    this.hub.onMessageReceived.subscribe((message) => this.onMessageReceived(message));
  }

  private connect() {
    Logger.log("Connecting to Stream Deck");

    this.status.setAsConnecting();

    this.hub.connect();
  }

  public configurationChanged(configuration: ExtensionConfiguration) {
    Logger.log("Configuration changed, restarting...");

    if (this.hub) {
      this.hub.disconnect();
    }

    this.createStreamDeckHub(configuration);

    this.connect();
  }

  reconnect() {
    Logger.log("Reconnecting to Stream Deck...");

    this.connect();
  }

  private onConnected() {
    Logger.log("Connected to Stream Deck.");

    this.status.setAsConnected();
  }

  private onMessageReceived(message: any) {
    try {
      const receivedMessage = <Message>JSON.parse(message);

      Logger.log(`Message received, ${receivedMessage.id}.: ${message}`);

      this.eventDispatcher.get(receivedMessage.id).dispatchAsync(this, JSON.parse(receivedMessage.data));
    } catch (error) {
      Logger.error(error);
    }
  }

  private onDisconnected() {
    Logger.log("Disconnected from Stream Deck.");

    this.status.setAsConnecting();

    this.connect();
  }

  changeActiveSession(sessionId: string) {
    const changeActiveSession = new ChangeActiveSessionMessage();
    changeActiveSession.sessionId = sessionId;
    this.hub.send(changeActiveSession);
  }

  setSessionAsActive() {
    this.status.setActive();
  }

  setSessionAsInactive() {
    this.status.setInactive();
  }

  get onChangeLanguageCommand() {
    return <IEvent<ExtensionController, ChangeLanguageMessage>>(
      this.eventDispatcher.get(ChangeLanguageMessage.name).asEvent()
    );
  }

  get onInsertSnippetCommand() {
    return <IEvent<ExtensionController, InsertSnippetMessage>>(
      this.eventDispatcher.get(InsertSnippetMessage.name).asEvent()
    );
  }

  get onOpenFolderCommand() {
    return <IEvent<ExtensionController, OpenFolderMessage>>this.eventDispatcher.get(OpenFolderMessage.name).asEvent();
  }

  get onExecuteCommand() {
    return <IEvent<ExtensionController, ExecuteCommandMessage>>(
      this.eventDispatcher.get(ExecuteCommandMessage.name).asEvent()
    );
  }

  get onCreateTerminal() {
    return <IEvent<ExtensionController, CreateTerminalMessage>>(
      this.eventDispatcher.get(CreateTerminalMessage.name).asEvent()
    );
  }

  get onExecuteTerminalCommand() {
    return <IEvent<ExtensionController, ExecuteTerminalCommandMessage>>(
      this.eventDispatcher.get(ExecuteTerminalCommandMessage.name).asEvent()
    );
  }

  get onActiveSessionChanged() {
    return <IEvent<ExtensionController, ActiveSessionChangedMessage>>(
      this.eventDispatcher.get(ActiveSessionChangedMessage.name).asEvent()
    );
  }
}
