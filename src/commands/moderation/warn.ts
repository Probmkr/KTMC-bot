import { ChatInputCommandInteraction, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types';
import { DiscordGuildAdapter } from '../../infrastructure/discord/guild.adapter';
import { moderationService } from '../../services';
import { DomainError } from '../../errors';

async function handleSetup(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    throw new DomainError('この操作にはサーバー管理権限が必要です');
  }

  const noticeRole  = interaction.options.getRole('notice-role', true);
  const warningRole = interaction.options.getRole('warning-role', true);

  await moderationService.setupGuild({
    guildId:       interaction.guildId!,
    noticeRoleId:  noticeRole.id,
    warningRoleId: warningRole.id,
  });

  await interaction.reply({ content: `設定を保存しました。\n注意ロール: <@&${noticeRole.id}>\n警告ロール: <@&${warningRole.id}>`, flags: 'Ephemeral' as const });
}

async function handleAdd(interaction: ChatInputCommandInteraction): Promise<void> {
  const user    = interaction.options.getUser('user', true);
  const reason  = interaction.options.getString('reason') ?? '理由なし';
  const timeout = interaction.options.getInteger('timeout');

  const result = await moderationService.addWarning({
    userId:      user.id,
    guildId:     interaction.guildId!,
    moderatorId: interaction.user.id,
    reason,
    timeoutMs:   timeout ? timeout * 60 * 1000 : undefined,
    guild:       new DiscordGuildAdapter(interaction.guild!),
  });

  if (result.banned) {
    await interaction.reply({ content: `${user} を BAN しました（警告3回）\n理由: ${reason}`, flags: 'Ephemeral' as const });
  } else {
    const timeoutText = timeout ? `\nタイムアウト: ${timeout}分` : '';
    await interaction.reply({ content: `${user} に警告を追加しました\n理由: ${reason}${timeoutText}`, flags: 'Ephemeral' as const });
  }
}

async function handleRemove(interaction: ChatInputCommandInteraction): Promise<void> {
  const user = interaction.options.getUser('user', true);

  await moderationService.removeWarning({
    userId:      user.id,
    guildId:     interaction.guildId!,
    moderatorId: interaction.user.id,
    guild:       new DiscordGuildAdapter(interaction.guild!),
  });

  await interaction.reply({ content: `${user} の警告を1回取り消しました`, flags: 'Ephemeral' as const });
}

async function handleList(interaction: ChatInputCommandInteraction): Promise<void> {
  const user   = interaction.options.getUser('user', true);
  const status = await moderationService.getWarnings({ userId: user.id, guildId: interaction.guildId! });

  const levelText = ['なし', '注意', '警告'][status.count] ?? '警告';
  const logLines  = status.logs.slice(-5).map(l => {
    const date = l.createdAt.toLocaleDateString('ja-JP');
    return `- ${date} \`${l.action}\` ${l.reason}`;
  });

  const logsText = logLines.length > 0 ? logLines.join('\n') : 'なし';
  await interaction.reply({
    content: `**${user.tag} の警告状況**\n現在の警告回数: ${status.count} (${levelText})\n\n**直近の履歴（最大5件）**\n${logsText}`,
    flags: 'Ephemeral' as const,
  });
}

const command: Command = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('警告管理')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('モデレーション用ロールを設定します（管理者のみ）')
        .addRoleOption(opt => opt.setName('notice-role').setDescription('注意ロール').setRequired(true))
        .addRoleOption(opt => opt.setName('warning-role').setDescription('警告ロール').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('add')
        .setDescription('ユーザーに警告を追加します')
        .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('理由'))
        .addIntegerOption(opt => opt.setName('timeout').setDescription('タイムアウト時間（分）').setMinValue(1))
    )
    .addSubcommand(sub =>
      sub.setName('remove')
        .setDescription('ユーザーの警告を1回取り消します')
        .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('ユーザーの警告状況を確認します')
        .addUserOption(opt => opt.setName('user').setDescription('対象ユーザー').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === 'setup')  return await handleSetup(interaction);
    if (sub === 'add')    return await handleAdd(interaction);
    if (sub === 'remove') return await handleRemove(interaction);
    if (sub === 'list')   return await handleList(interaction);
  },
};

export default command;
