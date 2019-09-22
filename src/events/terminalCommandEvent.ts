import { Event } from "./event";

export interface TerminalCommandEvent extends Event {
  command: string;
}
