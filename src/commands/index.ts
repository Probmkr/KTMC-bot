import { Collection } from 'discord.js';
import { Command } from '../types';

export async function loadCommands(): Promise<Collection<string, Command>> {
  const commands = new Collection<string, Command>();

  const { default: ping } = await import('./utility/ping');
  commands.set(ping.data.name, ping);

  const { default: warn } = await import('./moderation/warn');
  commands.set(warn.data.name, warn);

  const { default: ban } = await import('./moderation/ban');
  commands.set(ban.data.name, ban);

  return commands;
}
