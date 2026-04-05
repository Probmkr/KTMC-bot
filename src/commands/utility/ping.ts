import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Pong!'),

  async execute(interaction) {
    const latency = Date.now() - interaction.createdTimestamp;
    await interaction.reply({ content: `Pong! \`${latency}ms\``, flags: 'Ephemeral' as const });
  },
};

export default command;
