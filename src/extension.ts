import * as vscode from "vscode";
import { ExtensionController } from "./extensionController";
import { OutputChannelName, Commands, ExtensionScheme, Configurations } from "./constants";
import { CreateTerminalMessage } from "./messages/createTerminalMessage";
import { ExecuteTerminalCommandMessage } from "./messages/executeTerminalCommandMessage";
import { ExecuteCommandMessage } from "./messages/executeCommandMessage";
import { ExtensionConfiguration } from "./configuration";
import { ActiveSessionChangedMessage } from "./messages/activeSessionChangedMessage";
import { create } from "domain";

let extensionController: ExtensionController;

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel(OutputChannelName);
  context.subscriptions.push(outputChannel);

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
  context.subscriptions.push(statusBar);

  const configuration = new ExtensionConfiguration();
  loadOrUpdateConfiguration(configuration);

  extensionController = new ExtensionController(statusBar, outputChannel, configuration);

  registerCommands(context, extensionController);

  subscriptions(context, extensionController);

  extensionController.activate();

  vscode.window.onDidChangeWindowState(state => windowStateChanged(extensionController, state));
  vscode.workspace.onDidChangeConfiguration(() => configurationChanged(extensionController, configuration));

  // console.log("PROCESS PID", process.pid);
  // console.log("PROCESS PPID", process.ppid);

  // process.on("message", (msg, handle) => console.log("Process message received", msg));

  // process.send!("hello world");
  // process.emit("message", "hello world 2", "me sending");
}

export function deactivate() {
  extensionController.deactivate();
}

function windowStateChanged(extensionController: ExtensionController, state: vscode.WindowState) {
  if (state.focused) {
    extensionController.changeActiveSession(vscode.env.sessionId);
  }
}

function configurationChanged(extensionController: ExtensionController, configuration: ExtensionConfiguration) {
  loadOrUpdateConfiguration(configuration);

  extensionController.configurationChanged(configuration);
}

function loadOrUpdateConfiguration(configuration: ExtensionConfiguration) {
  let extensionConfiguration = vscode.workspace.getConfiguration();

  if (extensionConfiguration) {
    configuration.host = <string>extensionConfiguration.get(Configurations.ServerHost);
    configuration.port = <number>extensionConfiguration.get(Configurations.ServerPort);
  }
}

function registerCommands(context: vscode.ExtensionContext, extensionController: ExtensionController) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`${ExtensionScheme}.${Commands.Reconnect}`, () => {
      extensionController.reconnect();
    })
  );
}

function subscriptions(context: vscode.ExtensionContext, extensionController: ExtensionController) {
  extensionController.onCreateTerminal.subscribe((_, request) => createTerminal(context, request));
  extensionController.onExecuteTerminalCommand.subscribe((_, request) => executeTerminalCommand(context, request));
  extensionController.onExecuteCommand.subscribe((_, request) => executeCommand(request));
  extensionController.onActiveSessionChanged.subscribe((_, request) => onActiveSessionChanged(request));
}

function onActiveSessionChanged(request: ActiveSessionChangedMessage) {
  if (request.sessionId === vscode.env.sessionId) {
    extensionController.setSessionAsActive();
  } else {
    extensionController.setSessionAsInactive();
  }
}

function executeCommand(request: ExecuteCommandMessage) {
  if (request.command) {
    vscode.commands.executeCommand(request.command, request.arguments ? [...request.arguments] : []);
  }
}

function executeTerminalCommand(context: vscode.ExtensionContext, request: ExecuteTerminalCommandMessage) {
  let terminal = vscode.window.activeTerminal as vscode.Terminal;

  if (terminal && request.command) {
    terminal.show(true);
    terminal.sendText(request.command);
  }
}

function createTerminal(context: vscode.ExtensionContext, request: CreateTerminalMessage) {
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
