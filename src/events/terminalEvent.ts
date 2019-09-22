import { Event } from "./event";

export interface TerminalEvent extends Event {
  name?: string;
  preserveFocus: boolean;
  shellPath?: string;
  shellArgs?: string;
  workingDirectory?: string;
  environment?: { [key: string]: string };
}
