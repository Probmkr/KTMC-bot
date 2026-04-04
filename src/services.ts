import { ModerationService } from './application/moderation/moderation.service';
import { DrizzleUserWarningRepository } from './infrastructure/repository/user-warning.repository';

const userWarningRepository = new DrizzleUserWarningRepository();

export const moderationService = new ModerationService(userWarningRepository);
