import { Collection } from 'discord.js';
import { Command } from '../types';

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();

  const { default: ping } = await import('./utility/ping');
  commands.set(ping.data.name, ping);

  return commands;
}
