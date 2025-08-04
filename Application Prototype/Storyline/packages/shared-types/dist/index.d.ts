export * from './user';
export * from './document';
export * from './voice';
export * from './ai';
export * from './auth';
export * from './api';
export * from './export';
export interface Persona {
    id: string;
    name: string;
    description: string;
    systemPrompt: string;
    voiceSettings?: {
        tone: string;
        speed: number;
        pitch: number;
    };
}
//# sourceMappingURL=index.d.ts.map