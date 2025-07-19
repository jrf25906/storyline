import { field, relation } from '@nozbe/watermelondb/decorators';
import { BaseModel } from '@services/database/watermelon/models/BaseModel';
import { Associations } from '@nozbe/watermelondb/Model';

export type CoachTone = 'hype' | 'pragmatist' | 'tough-love';
export type ConversationRole = 'user' | 'assistant';

export class CoachConversation extends BaseModel {
  static table = 'coach_conversations';

  static associations: Associations = {
    profiles: { type: 'belongs_to', key: 'user_id' }
  };

  @field('user_id') userId!: string;
  @field('message') message!: string;
  @field('role') role!: ConversationRole;
  @field('tone') tone?: CoachTone;

  @relation('profiles', 'user_id') profile!: any;

  validateRole(role: string): role is ConversationRole {
    return role === 'user' || role === 'assistant';
  }

  validateTone(tone: string): tone is CoachTone {
    return tone === 'hype' || tone === 'pragmatist' || tone === 'tough-love';
  }

  isUserMessage(): boolean {
    return this.role === 'user';
  }

  isAssistantMessage(): boolean {
    return this.role === 'assistant';
  }

  getToneEmoji(): string {
    switch (this.tone) {
      case 'hype': return '🎉';
      case 'pragmatist': return '📋';
      case 'tough-love': return '💪';
      default: return '💬';
    }
  }

  getToneLabel(): string {
    switch (this.tone) {
      case 'hype': return 'Motivational';
      case 'pragmatist': return 'Practical';
      case 'tough-love': return 'Direct';
      default: return 'Coach';
    }
  }

  getMessagePreview(maxLength: number = 50): string {
    if (this.message.length <= maxLength) return this.message;
    return this.message.substring(0, maxLength) + '...';
  }

  containsEmotionalTrigger(): boolean {
    const triggers = {
      hype: ['hopeless', 'lost', 'worthless', 'failure', 'burnt out'],
      'tough-love': ['lazy', 'they screwed me', 'no one will hire me', 'this is rigged']
    };

    const lowerMessage = this.message.toLowerCase();
    
    for (const [tone, keywords] of Object.entries(triggers)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return true;
      }
    }
    
    return false;
  }

  getDaysOld(): number {
    const created = new Date(this.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  isOlderThan(days: number): boolean {
    return this.getDaysOld() > days;
  }
}