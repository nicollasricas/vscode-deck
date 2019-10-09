export class TerminalCreateMessage {
  name?: string;
  preserveFocus!: boolean;
  shellPath?: string;
  shellArgs?: string;
  workingDirectory?: string;
  environment?: { [key: string]: string };
}
