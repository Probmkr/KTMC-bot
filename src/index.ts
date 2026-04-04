import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { Command } from './types';
import { DomainError } from './errors';
import { replyError } from './lib/reply';
import { loadCommands } from './commands';
import { DiscordGuildAdapter } from './infrastructure/discord/guild.adapter';
import { moderationService } from './services';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection();

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

client.once(Events.ClientReady, async c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);

  for (const guild of c.guilds.cache.values()) {
    await moderationService.runDegradationCheck(guild.id, guild.client.user!.id, new DiscordGuildAdapter(guild)).catch(console.error);
  }

  setInterval(async () => {
    for (const guild of client.guilds.cache.values()) {
      await moderationService.runDegradationCheck(guild.id, guild.client.user!.id, new DiscordGuildAdapter(guild)).catch(console.error);
    }
  }, ONE_DAY_MS);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    if (error instanceof DomainError) {
      await replyError(interaction, error.message);
    } else {
      console.error(error);
      await replyError(interaction, '予期せぬエラーが発生しました');
    }
  }
});

(async () => {
  client.commands = await loadCommands();
  await client.login(process.env.BOT_TOKEN);
})();
