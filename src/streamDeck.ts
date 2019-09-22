import * as vscode from "vscode";
import { EventList, IEvent } from "strongly-typed-events";
import { TerminalEvent } from "./events/terminalEvent";
import { Event } from "./events/event";
import { StreamDeckStatus } from "./streamDeckStatus";
import { TerminalCommandEvent } from "./events/terminalCommandEvent";
import { CommandEvent } from "./events/commandEvent";
import WebSocket = require("ws");

export class StreamDeck {
  public connection!: WebSocket;

  private connectionStatus: StreamDeckStatus;

  constructor(context: vscode.ExtensionContext, private outputChannel: vscode.OutputChannel, private host: string, private port: number) {
    this.connectionStatus = new StreamDeckStatus(context);

    this.connect();
  }

  private connect() {
    this.connectionStatus.setConnecting();

    this.outputChannel.appendLine(`Connecting to stream deck ${this.host}:${this.port}...`);

    this.createConnection();
  }

  private createConnection() {
    this.connection = new WebSocket(`ws://${this.host}:${this.port}`);
    this.connection.on("open", () => this.onConnected());
    this.connection.on("close", () => this.onDisconnected());
    this.connection.on("message", data => this.onMessageReceived(data));
    this.connection.on("error", () => {});
  }

  private isConnected() {
    return this.connection && this.connection.readyState === WebSocket.OPEN;
  }

  reconnect() {
    this.outputChannel.appendLine("Reconnecting to stream deck...");

    this.connect();
  }

  private onConnected() {
    this.connectionStatus.setConnnected();

    this.outputChannel.appendLine("Connected to stream deck.");
  }

  private onMessageReceived(data: any) {
    try {
      let event = <Event>JSON.parse(data);

      this.outputChannel.appendLine(`Stream Deck event received ${data}.`);

      this.eventDispatcher.get(event.id).dispatchAsync(this, event);
    } catch {}
  }

  private onDisconnected() {
    this.connectionStatus.setDisconnected();

    this.outputChannel.appendLine("Disconnected from stream deck.");

    this.connect();
  }

  sendJSON(message: any) {
    this.send(JSON.stringify(message));
  }

  send(message: string) {
    if (this.isConnected()) {
      this.connection.send(message);
    }
  }

  changeSession(sessionId: string) {
    this.sendJSON({
      id: "change-session",
      sessionId
    });
  }

  private eventDispatcher: EventList<StreamDeck, Event> = new EventList<StreamDeck, Event>();

  get onCommandRequest() {
    return <IEvent<StreamDeck, CommandEvent>>this.eventDispatcher.get("command-request").asEvent();
  }

  get onTerminalRequest() {
    return <IEvent<StreamDeck, TerminalEvent>>this.eventDispatcher.get("terminal-request").asEvent();
  }

  get onTerminalCommandRequest() {
    return <IEvent<StreamDeck, TerminalCommandEvent>>this.eventDispatcher.get("terminal-command-request").asEvent();
  }
}
