import { SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types';
import { ModerationService } from '../../application/moderation/moderation.service';
import { DrizzleUserWarningRepository } from '../../infrastructure/repository/user-warning.repository';
import { DiscordGuildAdapter } from '../../infrastructure/discord/guild.adapter';

const moderationService = new ModerationService(new DrizzleUserWarningRepository());

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('ユーザーを BAN します')
    .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('理由')),

  async execute(interaction) {
    const user   = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? '理由なし';

    await moderationService.executeBan({
      userId:      user.id,
      guildId:     interaction.guildId!,
      moderatorId: interaction.user.id,
      reason,
      guild:       new DiscordGuildAdapter(interaction.guild!),
    });

    await interaction.reply({ content: `${user} を BAN しました\n理由: ${reason}`, ephemeral: true });
  },
};

export default command;
