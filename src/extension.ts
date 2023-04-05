import * as vscode from "vscode";
import Logger from "./logger";
import { ExtensionController } from "./extensionController";
import { Commands, ExtensionScheme, Configurations } from "./constants";
import { CreateTerminalMessage } from "./messages/createTerminalMessage";
import { ExecuteTerminalCommandMessage } from "./messages/executeTerminalCommandMessage";
import { ExecuteCommandMessage } from "./messages/executeCommandMessage";
import { ExtensionConfiguration } from "./configuration";
import { ActiveSessionChangedMessage } from "./messages/activeSessionChangedMessage";
import { ChangeLanguageMessage } from "./messages/changeLanguagMessage";
import { InsertSnippetMessage } from "./messages/insertSnippetMessage";
import { OpenFolderMessage } from "./messages/openFolderMessage";

let extensionController: ExtensionController;

export function activate(context: vscode.ExtensionContext) {
  Logger.initialize(context);

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
  statusBar.command = `${ExtensionScheme}.${Commands.ActivateSession}`;
  statusBar.tooltip = "Click to activate this session.";
  context.subscriptions.push(statusBar);

  const initialConfiguration = loadExtensionConfiguration();

  extensionController = new ExtensionController(statusBar, vscode.env.sessionId, initialConfiguration);

  registerCommands(context, extensionController);

  subscriptions(context, extensionController);

  extensionController.activate();

  Logger.log(`Registering session ${vscode.env.sessionId}`);

  vscode.window.onDidChangeWindowState((state) => windowStateChanged(extensionController, state));
  vscode.workspace.onDidChangeConfiguration(() => configurationChanged(extensionController, initialConfiguration));
}

export function deactivate() {
  extensionController.deactivate();
}

function windowStateChanged(extensionController: ExtensionController, state: vscode.WindowState) {
  if (state.focused) {
    extensionController.changeActiveSession(vscode.env.sessionId);
  }
}

function configurationChanged(extensionController: ExtensionController, initialConfiguration: ExtensionConfiguration) {
  const currentConfiguration = loadExtensionConfiguration();

  if (!currentConfiguration.equals(initialConfiguration)) {
    extensionController.configurationChanged(currentConfiguration);
  }
}

function loadExtensionConfiguration(): ExtensionConfiguration {
  const workspaceConfiguration = vscode.workspace.getConfiguration();
  return ExtensionConfiguration.create(workspaceConfiguration);
}

function registerCommands(context: vscode.ExtensionContext, extensionController: ExtensionController) {
  context.subscriptions.push(
    vscode.commands.registerCommand(`${ExtensionScheme}.${Commands.Reconnect}`, () => {
      extensionController.reconnect();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(`${ExtensionScheme}.${Commands.ActivateSession}`, () => {
      Logger.log(`Activation requested to ${vscode.env.sessionId}`);

      try {
        extensionController.changeActiveSession(vscode.env.sessionId);
      } catch (error) {
        Logger.error(error);
      }
    })
  );
}

function subscriptions(context: vscode.ExtensionContext, extensionController: ExtensionController) {
  extensionController.onCreateTerminal.subscribe((_, request) => createTerminal(context, request));
  extensionController.onExecuteTerminalCommand.subscribe((_, request) => executeTerminalCommand(request));
  extensionController.onExecuteCommand.subscribe((_, request) => executeCommand(request));
  extensionController.onActiveSessionChanged.subscribe((_, request) => onActiveSessionChanged(request));
  extensionController.onChangeLanguageCommand.subscribe((_, request) => changeLanguage(request));
  extensionController.onInsertSnippetCommand.subscribe((_, request) => insertSnippet(request));
  extensionController.onOpenFolderCommand.subscribe((_, request) => openFolder(request));
}

function onActiveSessionChanged(request: ActiveSessionChangedMessage) {
  if (request.sessionId === vscode.env.sessionId) {
    extensionController.setSessionAsActive();
  } else {
    extensionController.setSessionAsInactive();
  }
}

function changeLanguage(request: ChangeLanguageMessage) {
  if (vscode.window.activeTextEditor) {
    vscode.languages.setTextDocumentLanguage(vscode.window.activeTextEditor.document, request.languageId);
  }
}

function insertSnippet(request: InsertSnippetMessage) {
  if (request.name) {
    vscode.commands.executeCommand("editor.action.insertSnippet", {
      name: request.name,
    });
  }
}

function openFolder(request: OpenFolderMessage) {
  if (request.path) {
    vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(request.path), request.newWindow);
  }
}

function executeCommand(request: ExecuteCommandMessage) {
  if (request.command) {
    let commandArguments;

    try {
      commandArguments = JSON.parse(request.arguments);
    } catch (error) {
      Logger.error(error);
    }

    if (commandArguments) {
      vscode.commands.executeCommand(request.command, commandArguments);
    } else {
      vscode.commands.executeCommand(request.command);
    }
  }
}

function executeTerminalCommand(request: ExecuteTerminalCommandMessage) {
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
    shellPath: request.shellPath,
  });

  terminal.show(request.preserveFocus);

  context.subscriptions.push(terminal);
}
