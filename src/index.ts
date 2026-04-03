import 'dotenv/config';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import { Command } from './types';
import { DomainError } from './errors';
import { replyError } from './lib/reply';
import { loadCommands } from './commands';

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
}) as Client & { commands: Collection<string, Command> };

client.commands = new Collection();

client.once(Events.ClientReady, c => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
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
