import { ChatInputCommandInteraction } from 'discord.js';

export async function replyError(
  interaction: ChatInputCommandInteraction,
  message: string
): Promise<void> {
  const payload = { content: message, flags: 'Ephemeral' as const };
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(payload);
  } else {
    await interaction.reply(payload);
  }
}
