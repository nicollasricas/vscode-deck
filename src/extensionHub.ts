import { SignalDispatcher, SimpleEventDispatcher } from "strongly-typed-events";
import WebSocket = require("ws");
import { Message } from "./messages/message";
import { MessageChannel } from "worker_threads";

export class ExtensionHub {
  private _onConnected = new SignalDispatcher();
  private _onDisconnected = new SignalDispatcher();
  private _onMessageReceived = new SimpleEventDispatcher<any>();
  private socket!: WebSocket;

  constructor(private host: string, private port: number) {}

  connect() {
    this.socket = new WebSocket(`ws://${this.host}:${this.port}`);
    this.socket.on("open", () => this._onConnected.dispatch());
    this.socket.on("message", message => this._onMessageReceived.dispatch(message));
    this.socket.on("close", () => this._onDisconnected.dispatch());
    this.socket.on("error", () => {});
  }

  disconnect() {
    this._onConnected.clear();
    this._onDisconnected.clear();
    this._onMessageReceived.clear();

    this.socket.close();
  }

  send(message: any) {
    if (this.socket) {
      this.socket.send(<Message>{
        id: message.name,
        data: JSON.stringify(message)
      });
    }
  }

  get onConnected() {
    return this._onConnected.asEvent();
  }

  get onDisconnected() {
    return this._onDisconnected.asEvent();
  }

  get onMessageReceived() {
    return this._onMessageReceived.asEvent();
  }
}
