import * as vscode from "vscode";
import { ExtensionController } from "./extensionController";
import { OutputChannelName, Commands, ExtensionScheme, Configurations } from "./constants";
import { TerminalCreateMessage } from "./messages/terminalCreateMessage";
import { TerminalCommandMessage } from "./messages/terminalCommandMessage";
import { CommandMessage } from "./messages/commandMessage";
import { ExtensionConfiguration } from "./configuration";

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
  registerFeatures(context, extensionController);

  extensionController.activate();

  vscode.window.onDidChangeWindowState(state => windowStateChanged(extensionController, state));
  vscode.workspace.onDidChangeConfiguration(() => configurationChanged(extensionController, configuration));
}

export function deactivate() {
  extensionController.deactivate();
}

function windowStateChanged(extensionController: ExtensionController, state: vscode.WindowState) {
  if (state.focused) {
    extensionController.changeActiveSession(vscode.env.sessionId);
  } else {
    extensionController.setSessionAsInactive();
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

function registerFeatures(context: vscode.ExtensionContext, extensionController: ExtensionController) {
  extensionController.onTerminalCreate.subscribe((_, request) => createTerminal(context, request));
  extensionController.onTerminalCommand.subscribe((_, request) => executeTerminalCommand(request));
  extensionController.onCommand.subscribe((_, request) => executeCommand(request));

  extensionController.onActiveSessionChanged.subscribe((_, request) => {
    if (request.sessionId === vscode.env.sessionId) {
      extensionController.setSessionAsActive();
    } else {
    }
  });
}

function executeCommand(request: CommandMessage) {
  if (request.command) {
    vscode.commands.executeCommand(request.command, request.arguments ? [...request.arguments] : []);
  }
}

function executeTerminalCommand(request: TerminalCommandMessage) {
  let terminal = vscode.window.activeTerminal as vscode.Terminal;

  if (terminal && request.command) {
    terminal.show(true);
    terminal.sendText(request.command);
  }
}

function createTerminal(context: vscode.ExtensionContext, request: TerminalCreateMessage) {
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
