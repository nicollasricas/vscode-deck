import type * as vscode from "vscode";
import { Configurations } from "./constants";

export class ExtensionConfiguration {
  private constructor(public host: string = "127.0.0.1", public port: number = 48969) {}

  public static create(configuration?: vscode.WorkspaceConfiguration): ExtensionConfiguration {
    return configuration
      ? new ExtensionConfiguration(
          configuration.get<string>(Configurations.ServerHost),
          configuration.get<number>(Configurations.ServerPort)
        )
      : new ExtensionConfiguration();
  }

  public equals(configuration: ExtensionConfiguration) {
    return this.host === configuration.host && this.port === configuration.port;
  }
}
