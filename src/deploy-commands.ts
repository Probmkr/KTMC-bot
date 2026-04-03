import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { loadCommands } from './commands';

const token   = process.env.BOT_TOKEN!;
const appId   = process.env.APP_ID!;
const guildId = process.env.GUILD_ID;

const rest = new REST().setToken(token);

(async () => {
  const commands = await loadCommands();
  const body = [...commands.values()].map(c => c.data.toJSON());

  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(appId, guildId), { body });
    console.log(`ギルドコマンドを登録しました (guild: ${guildId})`);
  } else {
    await rest.put(Routes.applicationCommands(appId), { body });
    console.log('グローバルコマンドを登録しました');
  }
})();
