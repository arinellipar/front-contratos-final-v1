/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @fileoverview Comprehensive Authentication Type Definitions
 * @module @/lib/types/auth
 * @description Centralized type contracts for authentication operations
 * with strict interface compliance and exhaustive type coverage
 * @version 2.0.0 - Optimized without duplicate exports
 */

// ============================================================================
// CORE AUTHENTICATION INTERFACES
// ============================================================================
// src/lib/api/auth.ts
/**
 * User authentication credentials for login operations
 * @interface LoginCredentials
 */
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
  readonly captchaToken?: string;
  readonly deviceFingerprint?: string;
}

/**
 * User registration data with comprehensive validation constraints
 * @interface RegisterData
 */
export interface RegisterData {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly nomeCompleto: string;
  readonly filial: number;
  readonly acceptTerms: boolean;
  readonly marketingConsent?: boolean;
  readonly referralCode?: string;
}

/**
 * Password change request with current password verification
 * @interface ChangePasswordRequest
 */
export interface ChangePasswordRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
  readonly sessionId?: string;
  readonly requireReauth?: boolean;
}

/**
 * Password reset request with secure token validation
 * @interface ResetPasswordRequest
 */
export interface ResetPasswordRequest {
  readonly token: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
  readonly userId?: string;
  readonly expiryValidation?: boolean;
}

/**
 * Forgot password initiation request
 * @interface ForgotPasswordRequest
 */
export interface ForgotPasswordRequest {
  readonly email: string;
  readonly captchaToken?: string;
  readonly clientIpAddress?: string;
  readonly userAgent?: string;
}

/**
 * Email verification request structure
 * @interface EmailVerificationRequest
 */
export interface EmailVerificationRequest {
  readonly userId: string;
  readonly token: string;
  readonly timestamp?: number;
  readonly clientValidation?: boolean;
}

/**
 * Refresh token request for token renewal
 * @interface RefreshTokenRequest
 */
export interface RefreshTokenRequest {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly deviceId?: string;
  readonly clientVersion?: string;
}

// ============================================================================
// AUTHENTICATION RESPONSE INTERFACES
// ============================================================================

/**
 * Comprehensive authentication response with security metadata
 * @interface AuthResponse
 */
export interface AuthResponse {
  readonly user: AuthenticatedUser;
  readonly token: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly refreshExpiresIn: number;
  readonly tokenType: "Bearer";
  readonly scope: string[];
  readonly sessionId: string;
  readonly isFirstLogin?: boolean;
  readonly requiresPasswordChange?: boolean;
  readonly mfaRequired?: boolean;
}

/**
 * Authenticated user profile with comprehensive metadata
 * @interface AuthenticatedUser
 */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly nomeCompleto: string;
  readonly emailConfirmed: boolean;
  readonly phoneConfirmed?: boolean;
  readonly dataCadastro: string;
  readonly dataUltimoLogin?: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly profileImageUrl?: string;
  readonly preferredLanguage: string;
  readonly timezone: string;
  readonly isActive: boolean;
  readonly isLocked: boolean;
  readonly lockoutEnd?: string;
  readonly failedLoginAttempts: number;
  readonly mfaEnabled: boolean;
  readonly lastPasswordChange?: string;
  readonly contractCount?: number;
  readonly departmentId?: string;
  readonly managerId?: string;
}

/**
 * Token validation response with security context
 * @interface TokenValidationResponse
 */
export interface TokenValidationResponse {
  readonly isValid: boolean;
  readonly userId?: string;
  readonly expiresAt?: string;
  readonly scope: readonly string[];
  readonly issuer: string;
  readonly audience: string;
  readonly tokenType: string;
  readonly jwtId: string;
}

// ============================================================================
// AUTHENTICATION ERROR INTERFACES
// ============================================================================

/**
 * Comprehensive authentication error with detailed context
 * @interface AuthError
 */
export interface AuthError {
  readonly code: AuthErrorCode;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly requestId: string;
  readonly retryAfter?: number;
  readonly supportReference?: string;
}

/**
 * Authentication error codes enumeration
 * @enum AuthErrorCode
 */
export enum AuthErrorCode {
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
  ACCOUNT_DISABLED = "ACCOUNT_DISABLED",
  EMAIL_NOT_VERIFIED = "EMAIL_NOT_VERIFIED",
  PASSWORD_EXPIRED = "PASSWORD_EXPIRED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  TOKEN_INVALID = "TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED = "REFRESH_TOKEN_EXPIRED",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  RATE_LIMITED = "RATE_LIMITED",
  MFA_REQUIRED = "MFA_REQUIRED",
  MFA_INVALID = "MFA_INVALID",
  CAPTCHA_REQUIRED = "CAPTCHA_REQUIRED",
  CAPTCHA_INVALID = "CAPTCHA_INVALID",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  PASSWORD_REUSE = "PASSWORD_REUSE",
  INVALID_RESET_TOKEN = "INVALID_RESET_TOKEN",
  RESET_TOKEN_EXPIRED = "RESET_TOKEN_EXPIRED",
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  INVALID_EMAIL_FORMAT = "INVALID_EMAIL_FORMAT",
  TERMS_NOT_ACCEPTED = "TERMS_NOT_ACCEPTED",
  DEVICE_NOT_TRUSTED = "DEVICE_NOT_TRUSTED",
  LOCATION_RESTRICTED = "LOCATION_RESTRICTED",
  CONCURRENT_LOGIN_LIMIT = "CONCURRENT_LOGIN_LIMIT",
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// ============================================================================
// AUTHENTICATION STATE INTERFACES
// ============================================================================

/**
 * Complete authentication state with comprehensive metadata
 * @interface AuthState
 */
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isInitialized: boolean;
  readonly user: AuthenticatedUser | null;
  readonly accessToken: string | null;
  readonly refreshToken: string | null;
  readonly sessionExpiry: Date | null;
  readonly lastActivity: Date | null;
  readonly error: AuthError | null;
  readonly loginAttempts: number;
  readonly deviceTrusted: boolean;
  readonly sessionId: string | null;
}

/**
 * Session management configuration
 * @interface SessionConfig
 */
export interface SessionConfig {
  readonly accessTokenExpiryMinutes: number;
  readonly refreshTokenExpiryDays: number;
  readonly inactivityTimeoutMinutes: number;
  readonly warningThresholdMinutes: number;
  readonly maxConcurrentSessions: number;
  readonly rememberMeDays: number;
  readonly slideExpiration: boolean;
}

// ============================================================================
// MULTI-FACTOR AUTHENTICATION INTERFACES
// ============================================================================

/**
 * Multi-factor authentication request
 * @interface MfaRequest
 */
export interface MfaRequest {
  readonly userId: string;
  readonly method: MfaMethod;
  readonly code: string;
  readonly backupCode?: string;
  readonly trustDevice?: boolean;
  readonly deviceName?: string;
}

/**
 * MFA setup request for new factor registration
 * @interface MfaSetupRequest
 */
export interface MfaSetupRequest {
  readonly method: MfaMethod;
  readonly phoneNumber?: string;
  readonly backupCodes?: readonly string[];
  readonly deviceName?: string;
}

/**
 * Multi-factor authentication methods
 * @enum MfaMethod
 */
export enum MfaMethod {
  TOTP = "TOTP",
  SMS = "SMS",
  EMAIL = "EMAIL",
  BACKUP_CODES = "BACKUP_CODES",
  HARDWARE_TOKEN = "HARDWARE_TOKEN",
  BIOMETRIC = "BIOMETRIC",
}

/**
 * MFA challenge response
 * @interface MfaChallenge
 */
export interface MfaChallenge {
  readonly challengeId: string;
  readonly method: MfaMethod;
  readonly expiresAt: string;
  readonly qrCode?: string;
  readonly secretKey?: string;
  readonly backupCodes?: readonly string[];
  readonly phoneNumberMasked?: string;
  readonly emailMasked?: string;
}

// ============================================================================
// AUDIT AND SECURITY INTERFACES
// ============================================================================

/**
 * Authentication audit log entry
 * @interface AuthAuditLog
 */
export interface AuthAuditLog {
  readonly id: string;
  readonly userId?: string;
  readonly action: AuthAction;
  readonly result: AuthResult;
  readonly timestamp: string;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly location?: GeoLocation;
  readonly deviceFingerprint?: string;
  readonly sessionId?: string;
  readonly errorCode?: AuthErrorCode;
  readonly riskScore?: number;
  readonly metadata?: Record<string, unknown>;
}

/**
 * Authentication actions for audit logging
 * @enum AuthAction
 */
export enum AuthAction {
  LOGIN_ATTEMPT = "LOGIN_ATTEMPT",
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILURE = "LOGIN_FAILURE",
  LOGOUT = "LOGOUT",
  TOKEN_REFRESH = "TOKEN_REFRESH",
  PASSWORD_CHANGE = "PASSWORD_CHANGE",
  PASSWORD_RESET = "PASSWORD_RESET",
  EMAIL_VERIFICATION = "EMAIL_VERIFICATION",
  MFA_SETUP = "MFA_SETUP",
  MFA_VERIFICATION = "MFA_VERIFICATION",
  ACCOUNT_LOCK = "ACCOUNT_LOCK",
  ACCOUNT_UNLOCK = "ACCOUNT_UNLOCK",
  PROFILE_UPDATE = "PROFILE_UPDATE",
  PERMISSION_GRANT = "PERMISSION_GRANT",
  PERMISSION_REVOKE = "PERMISSION_REVOKE",
}

/**
 * Authentication result enumeration
 * @enum AuthResult
 */
export enum AuthResult {
  SUCCESS = "SUCCESS",
  FAILURE = "FAILURE",
  BLOCKED = "BLOCKED",
  RATE_LIMITED = "RATE_LIMITED",
  REQUIRES_MFA = "REQUIRES_MFA",
  REQUIRES_VERIFICATION = "REQUIRES_VERIFICATION",
}

/**
 * Geographic location for security tracking
 * @interface GeoLocation
 */
export interface GeoLocation {
  readonly country: string;
  readonly region?: string;
  readonly city?: string;
  readonly latitude?: number;
  readonly longitude?: number;
  readonly timezone?: string;
  readonly isp?: string;
}

// ============================================================================
// UTILITY TYPE DEFINITIONS
// ============================================================================

/**
 * Utility type for partial authentication updates
 */
export type AuthStateUpdate = Partial<
  Pick<
    AuthState,
    "user" | "accessToken" | "refreshToken" | "error" | "lastActivity"
  >
>;

/**
 * Utility type for safe authentication operations
 */
export type SafeAuthOperation<T> = {
  user: any;
  expiresIn: number;
  refreshToken: string;
  token: string;
  readonly success: boolean;
  readonly data?: T;
  readonly error?: AuthError;
  readonly metadata?: Record<string, unknown>;
};

// ============================================================================
// TYPE GUARDS WITH ENHANCED VALIDATION
// ============================================================================

/**
 * Type guard for authenticated user validation with comprehensive checks
 * @param user - Unknown value to validate
 * @returns Type predicate indicating if value is AuthenticatedUser
 */
export const isAuthenticatedUser = (
  user: unknown
): user is AuthenticatedUser => {
  if (typeof user !== "object" || user === null) return false;

  const u = user as Record<string, unknown>;

  // Required string fields
  const requiredStringFields = [
    "id",
    "email",
    "nomeCompleto",
    "dataCadastro",
    "preferredLanguage",
    "timezone",
  ];
  if (!requiredStringFields.every((field) => typeof u[field] === "string"))
    return false;

  // Required boolean fields
  const requiredBooleanFields = [
    "emailConfirmed",
    "isActive",
    "isLocked",
    "mfaEnabled",
  ];
  if (!requiredBooleanFields.every((field) => typeof u[field] === "boolean"))
    return false;

  // Required number fields
  if (typeof u.failedLoginAttempts !== "number") return false;

  // Required array fields
  if (!Array.isArray(u.roles) || !Array.isArray(u.permissions)) return false;

  // All array elements must be strings
  if (!(u.roles as unknown[]).every((role) => typeof role === "string"))
    return false;
  if (!(u.permissions as unknown[]).every((perm) => typeof perm === "string"))
    return false;

  return true;
};

/**
 * Type guard for valid authentication state with deep validation
 * @param state - Unknown value to validate
 * @returns Type predicate indicating if value is AuthState
 */
export const isValidAuthState = (state: unknown): state is AuthState => {
  if (typeof state !== "object" || state === null) return false;

  const s = state as Record<string, unknown>;

  // Required boolean fields
  const requiredBooleanFields = [
    "isAuthenticated",
    "isLoading",
    "isInitialized",
    "deviceTrusted",
  ];
  if (!requiredBooleanFields.every((field) => typeof s[field] === "boolean"))
    return false;

  // Required number fields
  if (typeof s.loginAttempts !== "number") return false;

  // Optional but typed fields
  if (s.user !== null && !isAuthenticatedUser(s.user)) return false;
  if (s.accessToken !== null && typeof s.accessToken !== "string") return false;
  if (s.refreshToken !== null && typeof s.refreshToken !== "string")
    return false;
  if (s.sessionExpiry !== null && !(s.sessionExpiry instanceof Date))
    return false;
  if (s.lastActivity !== null && !(s.lastActivity instanceof Date))
    return false;
  if (s.sessionId !== null && typeof s.sessionId !== "string") return false;

  // Error must be null or valid AuthError
  if (s.error !== null && !isAuthError(s.error)) return false;

  return true;
};

/**
 * Type guard for AuthError validation
 * @param error - Unknown value to validate
 * @returns Type predicate indicating if value is AuthError
 */
export const isAuthError = (error: unknown): error is AuthError => {
  if (typeof error !== "object" || error === null) return false;

  const e = error as Record<string, unknown>;

  return (
    typeof e.code === "string" &&
    Object.values(AuthErrorCode).includes(e.code as AuthErrorCode) &&
    typeof e.message === "string" &&
    typeof e.timestamp === "string" &&
    typeof e.requestId === "string"
  );
};

/**
 * Type guard for session configuration validation
 * @param config - Unknown value to validate
 * @returns Type predicate indicating if value is SessionConfig
 */
export const isValidSessionConfig = (
  config: unknown
): config is SessionConfig => {
  if (typeof config !== "object" || config === null) return false;

  const c = config as Record<string, unknown>;

  const requiredNumberFields = [
    "accessTokenExpiryMinutes",
    "refreshTokenExpiryDays",
    "inactivityTimeoutMinutes",
    "warningThresholdMinutes",
    "maxConcurrentSessions",
    "rememberMeDays",
  ];

  return (
    requiredNumberFields.every(
      (field) => typeof c[field] === "number" && c[field] > 0
    ) && typeof c.slideExpiration === "boolean"
  );
};

// ============================================================================
// ARCHITECTURAL NOTES ON MODULE DESIGN
// ============================================================================

/**
 * This module follows a disciplined export strategy:
 *
 * 1. DIRECT EXPORTS: All types, interfaces, and enums are exported inline
 *    at their declaration site for optimal tree-shaking.
 *
 * 2. NO RE-EXPORTS: Avoids the anti-pattern of re-exporting at the end
 *    of the file, which can cause duplicate export errors and hinder
 *    bundle optimization.
 *
 * 3. TYPE GUARDS: Exported as const functions for runtime validation
 *    while maintaining type safety.
 *
 * 4. IMMUTABILITY: All interfaces use readonly properties to enforce
 *    immutability at the type level.
 *
 * 5. DOCUMENTATION: Comprehensive JSDoc comments for IDE integration
 *    and automated documentation generation.
 *
 * Import Pattern:
 * ```typescript
 * import { LoginCredentials, AuthResponse, isAuthenticatedUser } from "@/lib/types/auth";
 * ```
 */
