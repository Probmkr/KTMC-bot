export interface GuildSettingProps {
  guildId:       string;
  noticeRoleId:  string;
  warningRoleId: string;
}

export class GuildSetting {
  private constructor(private readonly props: GuildSettingProps) {}

  static create(input: GuildSettingProps): GuildSetting {
    return new GuildSetting(input);
  }

  get guildId()       { return this.props.guildId; }
  get noticeRoleId()  { return this.props.noticeRoleId; }
  get warningRoleId() { return this.props.warningRoleId; }
}
