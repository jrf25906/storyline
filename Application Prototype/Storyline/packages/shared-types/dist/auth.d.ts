export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
}
export interface LoginRequest {
    email: string;
    password: string;
    rememberMe?: boolean;
}
export interface SignupRequest {
    email: string;
    password: string;
    name: string;
    acceptTerms: boolean;
}
export interface AuthUser {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    provider: AuthProvider;
    createdAt: Date;
}
export type AuthProvider = 'email' | 'google' | 'apple' | 'microsoft';
export interface Session {
    id: string;
    userId: string;
    token: string;
    deviceInfo: DeviceInfo;
    createdAt: Date;
    expiresAt: Date;
    lastActivityAt: Date;
}
export interface DeviceInfo {
    userAgent: string;
    ip: string;
    platform: string;
    browser?: string;
    os?: string;
}
export interface PasswordResetRequest {
    email: string;
}
export interface PasswordResetConfirm {
    token: string;
    newPassword: string;
}
export interface BiometricAuthRequest {
    userId: string;
    biometricData: string;
    deviceId: string;
    platform: 'ios' | 'android';
}
//# sourceMappingURL=auth.d.ts.map