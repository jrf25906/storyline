export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: ApiError;
    metadata?: ResponseMetadata;
}
export interface ApiError {
    code: string;
    message: string;
    details?: any;
    timestamp: Date;
    path?: string;
}
export interface ResponseMetadata {
    timestamp: Date;
    version: string;
    requestId: string;
    processingTime?: number;
}
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    items: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}
export interface WebSocketMessage {
    type: WebSocketMessageType;
    payload: any;
    timestamp: Date;
    correlationId?: string;
}
export type WebSocketMessageType = 'voice.start' | 'voice.data' | 'voice.end' | 'transcript.partial' | 'transcript.final' | 'ai.response' | 'document.update' | 'error' | 'ping' | 'pong';
export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: Date;
    retryAfter?: number;
}
//# sourceMappingURL=api.d.ts.map