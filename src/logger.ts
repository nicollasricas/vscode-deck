import * as vscode from "vscode";

export default class Logger {
  private static outputChannel: vscode.OutputChannel;

  static initialize(context: vscode.ExtensionContext) {
    this.outputChannel = vscode.window.createOutputChannel("Stream Deck");

    context.subscriptions.push(this.outputChannel);
  }

  static log(message: string) {
    this.outputChannel.appendLine(`[${new Date().toLocaleString()}] ${message}`);
  }

  static error(error: Error) {
    this.outputChannel.appendLine(`[ERROR] ${error.message}, Stack: ${error.stack}`);
  }
}
