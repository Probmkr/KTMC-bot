export interface GuildPort {
  banUser(userId: string, reason: string): Promise<void>;
  setMemberRoles(userId: string, rolesToAdd: string[], rolesToRemove: string[]): Promise<void>;
  timeoutMember(userId: string, durationMs: number, reason: string): Promise<void>;
}
