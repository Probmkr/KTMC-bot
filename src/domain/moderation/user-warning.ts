import { DomainError } from '../../errors';

export interface UserWarningProps {
  userId:    string;
  guildId:   string;
  count:     number;
  updatedAt: Date;
}

export class UserWarning {
  static readonly BAN_THRESHOLD     = 3;
  static readonly WARNING_THRESHOLD = 2;
  static readonly DOWNGRADE_DAYS = 365;

  private constructor(private readonly props: UserWarningProps) {}

  static create(input: UserWarningProps): UserWarning {
    if (input.count < 0) throw new DomainError('警告回数は 0 以上である必要があります');
    return new UserWarning(input);
  }

  get userId()    { return this.props.userId; }
  get guildId()   { return this.props.guildId; }
  get count()     { return this.props.count; }
  get updatedAt() { return this.props.updatedAt; }

  shouldBeBanned(): boolean {
    return this.props.count >= UserWarning.BAN_THRESHOLD;
  }

  shouldDowngrade(now: Date = new Date()): boolean {
    if (this.props.count <= 0) return false;
    const elapsedDays = (now.getTime() - this.props.updatedAt.getTime()) / 86400000;
    return elapsedDays >= UserWarning.DOWNGRADE_DAYS;
  }
}
