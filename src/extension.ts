import * as vscode from "vscode";
import { StreamDeck } from "./streamDeck";
import { OutputChannelName, Commands, ExtensionScheme, Configurations } from "./constants";
import { TerminalEvent } from "./events/terminalEvent";
import { TerminalCommandEvent } from "./events/terminalCommandEvent";
import { CommandEvent } from "./events/commandEvent";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(OutputChannelName);
  context.subscriptions.push(outputChannel);

  let configuration = vscode.workspace.getConfiguration();

  let host = <string>configuration.get(Configurations.ServerHost) || "127.0.0.1";
  let port = <number>configuration.get(Configurations.ServerPort) || 48969;

  const streamdeck = new StreamDeck(context, outputChannel, host, port);

  registerCommands(context, streamdeck);

  registerEvents(context, streamdeck);

  vscode.window.onDidChangeWindowState(state => {
    if (state.focused) {
      streamdeck.changeSession(vscode.env.sessionId);
    }
  });

  // input pattern
  // $(Component Name?:app-sidebar)
  // $(Shell?:\zbin\shell=\dock\zi)
  // $(displlay:placeholder=defaultvalue)

  // select pattern
  // $(display:placeholder=item1,item2,item3,item4,item4,item5,item6)

  // const inputBox = vscode.window.createInputBox();

  // inputBox.busy = true;
  // inputBox.enabled = true;
  // inputBox.placeholder = "app-sidebar";
  // inputBox.title = "Component name?";
  // inputBox.step = 1;
  // inputBox.totalSteps = 15;
  // //inputBox.validationMessage = "inválido esse valor man";
  // inputBox.show();

  // inputBox.onDidHide(m => {
  //   if (!inputBox.value) {
  //     vscode.window.showWarningMessage("value not inputted, reject the command execution");
  //   }
  // });

  // inputBox.onDidAccept(m => {
  //   vscode.window.showInformationMessage("accepted answer" + inputBox.value);
  //   inputBox.hide();
  // });

  /*
  vscode.commands.executeCommand('vscode.diff', vscode.Uri.file(this.uri.fsPath), vscode.Uri.file(right), `Diff ${path.basename(this.uri.fsPath)} (Head/Original)`, {});
*/
}

function registerCommands(context: vscode.ExtensionContext, streamdeck: StreamDeck) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`${ExtensionScheme}.${Commands.Reconnect}`, () => {
      streamdeck.reconnect();
    })
  );
}

function registerEvents(context: vscode.ExtensionContext, streamdeck: StreamDeck) {
  streamdeck.onTerminalRequest.subscribe((_, request) => createTerminal(context, request));
  streamdeck.onTerminalCommandRequest.subscribe((_, request) => executeTerminalCommand(request));
  streamdeck.onCommandRequest.subscribe((_, request) => executeCommand(request));
}

function executeCommand(request: CommandEvent) {
  if (request.command) {
    vscode.commands.executeCommand(request.command, request.arguments ? [...request.arguments] : []);
  }
}

function executeTerminalCommand(request: TerminalCommandEvent) {
  let terminal = vscode.window.activeTerminal as vscode.Terminal;

  if (terminal && request.command) {
    terminal.show(true);
    terminal.sendText(request.command);
  }
}

function createTerminal(context: vscode.ExtensionContext, request: TerminalEvent) {
  let terminal = vscode.window.createTerminal({
    name: request.name,
    cwd: request.workingDirectory,
    env: request.environment,
    shellArgs: request.shellArgs,
    shellPath: request.shellPath
  });

  terminal.show(request.preserveFocus);

  context.subscriptions.push(terminal);
}

export function deactivate() {
  // streamdeck.disconnect();
}
