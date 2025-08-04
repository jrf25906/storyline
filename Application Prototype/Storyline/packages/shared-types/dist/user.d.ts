export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
    subscription?: Subscription;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    voicePersona: VoicePersona;
    notifications: NotificationSettings;
    privacy: PrivacySettings;
}
export interface VoicePersona {
    id: string;
    name: string;
    tone: 'professional' | 'friendly' | 'supportive' | 'tough-love';
    language: string;
    customPrompt?: string;
}
export interface NotificationSettings {
    email: boolean;
    push: boolean;
    reminders: boolean;
    dailyGoals: boolean;
}
export interface PrivacySettings {
    publicProfile: boolean;
    shareAnalytics: boolean;
    allowAITraining: boolean;
}
export interface Subscription {
    id: string;
    plan: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'cancelled' | 'expired';
    startDate: Date;
    endDate?: Date;
    features: string[];
}
//# sourceMappingURL=user.d.ts.map