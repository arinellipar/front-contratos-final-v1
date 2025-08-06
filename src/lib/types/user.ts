/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/types/user.ts
/**
 * User type definitions matching the backend API models
 * Handles authentication, authorization, and user management
 */

/**
 * Base user interface matching the backend ApplicationUser model
 */
export interface User {
  id: string;
  email: string;
  nomeCompleto: string;
  emailConfirmed: boolean;
  dataCadastro: string; // ISO date string
  lastLoginDate?: string; // ISO date string
  roles: string[];
  contractCount?: number;

  // Additional user properties
  phoneNumber?: string;
  isActive?: boolean;
  isLocked?: boolean;
  lockoutEnabled?: boolean;
  lockoutEnd?: string;
  accessFailedCount?: number;
  twoFactorEnabled?: boolean;

  // Profile information
  profilePicture?: string;
  department?: string;
  position?: string;
  manager?: string;
  location?: string;
  timezone?: string;
  language?: string;

  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  updatedAt?: string;
}

/**
 * Login credentials interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  twoFactorCode?: string;
  recoveryCode?: string;
}

/**
 * User registration data
 */
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  nomeCompleto: string;
  acceptTerms?: boolean;

  // Optional additional fields
  phoneNumber?: string;
  department?: string;
  position?: string;
  inviteCode?: string;
}

/**
 * Authentication response from login/register
 */
export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
  message?: string;
}

/**
 * Token refresh request/response
 */
export interface RefreshTokenRequest {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Password reset request
 */
export interface ForgotPasswordRequest {
  email: string;
  resetUrl: string;
}

/**
 * Password reset data
 */
export interface ResetPasswordData {
  userId: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password change data
 */
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Profile update data
 */
export interface UpdateProfileData {
  nomeCompleto?: string;
  phoneNumber?: string;
  department?: string;
  position?: string;
  location?: string;
  timezone?: string;
  language?: string;
  profilePicture?: File;
}

/**
 * User creation data (admin)
 */
export interface CreateUserData {
  email: string;
  nomeCompleto: string;
  password: string;
  roles: string[];
  emailConfirmed?: boolean;
  phoneNumber?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
  sendWelcomeEmail?: boolean;
}

/**
 * User update data (admin)
 */
export interface UpdateUserData {
  nomeCompleto?: string;
  email?: string;
  phoneNumber?: string;
  roles?: string[];
  isActive?: boolean;
  emailConfirmed?: boolean;
  department?: string;
  position?: string;
  location?: string;
}

/**
 * User role management
 */
export interface UserRole {
  id: string;
  name: string;
  normalizedName: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Role assignment data
 */
export interface RoleAssignmentData {
  userId: string;
  roles: string[];
  reason?: string;
}

/**
 * User permissions interface
 */
export interface UserPermissions {
  contracts: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    export: boolean;
  };
  users: {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
    manageRoles: boolean;
  };
  reports: {
    view: boolean;
    create: boolean;
    export: boolean;
  };
  system: {
    admin: boolean;
    backup: boolean;
    maintenance: boolean;
    audit: boolean;
  };
}

/**
 * User session information
 */
export interface UserSession {
  sessionId: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  startTime: string;
  lastActivity: string;
  isActive: boolean;
  expiresAt: string;
}

/**
 * User activity log entry
 */
export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  details?: Record<string, any>;
  result: "success" | "failure" | "warning";
}

/**
 * User notification preferences
 */
export interface NotificationPreferences {
  email: {
    contractExpiry: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
    weeklyReports: boolean;
  };
  inApp: {
    contractExpiry: boolean;
    systemMessages: boolean;
    mentions: boolean;
    taskAssignments: boolean;
  };
  sms: {
    securityAlerts: boolean;
    criticalUpdates: boolean;
  };
  frequency: {
    digest: "immediate" | "daily" | "weekly" | "never";
    reminders: "1day" | "3days" | "1week" | "never";
  };
}

/**
 * User statistics for admin dashboard
 */
export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  lockedUsers: number;
  usersByRole: Record<string, number>;
  averageSessionDuration: number;
  loginFrequency: Record<string, number>;
  topActiveUsers: Array<{
    user: User;
    activityCount: number;
    lastActivity: string;
  }>;
}

/**
 * User filters for admin user management
 */
export interface UserFilters {
  search?: string;
  role?: string;
  department?: string;
  isActive?: boolean;
  isLocked?: boolean;
  emailConfirmed?: boolean;
  registeredAfter?: string;
  registeredBefore?: string;
  lastLoginAfter?: string;
  lastLoginBefore?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * User invitation data
 */
export interface UserInvitation {
  id: string;
  email: string;
  nomeCompleto: string;
  roles: string[];
  department?: string;
  position?: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  acceptedAt?: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  inviteCode: string;
  message?: string;
}

/**
 * Invitation creation data
 */
export interface CreateInvitationData {
  email: string;
  nomeCompleto: string;
  roles: string[];
  department?: string;
  position?: string;
  message?: string;
  expiryDays?: number;
  sendEmail?: boolean;
}

/**
 * Invitation acceptance data
 */
export interface AcceptInvitationData {
  inviteCode: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

/**
 * Two-factor authentication setup
 */
export interface TwoFactorSetup {
  qrCodeUrl: string;
  manualEntryKey: string;
  recoveryCodes: string[];
}

/**
 * Two-factor authentication verification
 */
export interface TwoFactorVerification {
  code: string;
  rememberDevice?: boolean;
}

/**
 * Email confirmation data
 */
export interface EmailConfirmationData {
  userId: string;
  token: string;
}

/**
 * User security settings
 */
export interface UserSecuritySettings {
  twoFactorEnabled: boolean;
  passwordExpiryDays?: number;
  sessionTimeoutMinutes: number;
  allowMultipleSessions: boolean;
  requirePasswordChange: boolean;
  lastPasswordChange?: string;
  securityQuestions?: Array<{
    question: string;
    answerHash: string;
  }>;
}

/**
 * User preferences and settings
 */
export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: "12h" | "24h";
  numberFormat: string;
  currency: string;
  contractsPerPage: number;
  defaultContractView: "table" | "grid" | "list";
  autoSave: boolean;
  notifications: NotificationPreferences;
}

/**
 * User profile completion status
 */
export interface ProfileCompletionStatus {
  overall: number;
  sections: {
    basic: number;
    contact: number;
    security: number;
    preferences: number;
    professional: number;
  };
  missingFields: string[];
  recommendations: string[];
}

/**
 * User export options
 */
export interface UserExportOptions {
  format: "excel" | "csv" | "pdf";
  filters?: UserFilters;
  includeActivity?: boolean;
  includePermissions?: boolean;
  fields?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * User audit trail entry
 */
export interface UserAuditEntry {
  id: string;
  userId: string;
  action:
    | "created"
    | "updated"
    | "deleted"
    | "login"
    | "logout"
    | "password_change"
    | "role_change";
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  performedBy: string;
  performedAt: string;
  ipAddress: string;
  userAgent: string;
  reason?: string;
}

/**
 * User role hierarchy levels
 */
export enum UserRoleLevel {
  VIEWER = 20,
  USER = 40,
  MANAGER = 60,
  ADMIN = 80,
  SUPER_ADMIN = 100,
}

/**
 * System roles enumeration
 */
export enum SystemRoles {
  SUPER_ADMIN = "SuperAdmin",
  ADMIN = "Admin",
  MANAGER = "Manager",
  USER = "User",
  VIEWER = "Viewer",
}

/**
 * User status enumeration
 */
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  LOCKED = "locked",
  SUSPENDED = "suspended",
  PENDING_VERIFICATION = "pending_verification",
}

/**
 * Authentication provider enumeration
 */
export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
  MICROSOFT = "microsoft",
  AZURE_AD = "azure_ad",
}

/**
 * Type guards for runtime validation
 */
export const isUser = (obj: any): obj is User => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.email === "string" &&
    typeof obj.nomeCompleto === "string" &&
    typeof obj.emailConfirmed === "boolean" &&
    typeof obj.dataCadastro === "string" &&
    Array.isArray(obj.roles)
  );
};

export const isAuthResponse = (obj: any): obj is AuthResponse => {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.token === "string" &&
    typeof obj.refreshToken === "string" &&
    typeof obj.expiresIn === "number" &&
    isUser(obj.user)
  );
};

/**
 * Utility functions for user management
 */
export const hasRole = (user: User, role: string): boolean => {
  return user.roles.includes(role);
};

export const hasAnyRole = (user: User, roles: string[]): boolean => {
  return roles.some((role) => user.roles.includes(role));
};

export const isAdmin = (user: User): boolean => {
  return hasAnyRole(user, [SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN]);
};

export const canManageUsers = (user: User): boolean => {
  return hasAnyRole(user, [SystemRoles.ADMIN, SystemRoles.SUPER_ADMIN]);
};

export const getUserDisplayName = (user: User): string => {
  return user.nomeCompleto || user.email;
};

export const formatUserRole = (role: string): string => {
  const roleMap: Record<string, string> = {
    [SystemRoles.SUPER_ADMIN]: "Super Administrador",
    [SystemRoles.ADMIN]: "Administrador",
    [SystemRoles.MANAGER]: "Gerente",
    [SystemRoles.USER]: "Usuário",
    [SystemRoles.VIEWER]: "Visualizador",
  };
  return roleMap[role] || role;
};

/**
 * Default values for user creation
 */
export const DefaultUserValues: Partial<CreateUserData> = {
  roles: [SystemRoles.USER],
  emailConfirmed: false,
  isActive: true,
  sendWelcomeEmail: true,
};

/**
 * User field validation rules
 */
export const UserValidationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 320,
  },
  nomeCompleto: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/,
  },
  password: {
    required: true,
    minLength: 8,
    maxLength: 128,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]/,
  },
  phoneNumber: {
    pattern: /^\+?[\d\s\-\(\)]+$/,
    maxLength: 20,
  },
} as const;
