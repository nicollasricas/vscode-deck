import { Event } from "./event";

export interface CommandEvent extends Event {
  command: string;

  arguments: string;
}
